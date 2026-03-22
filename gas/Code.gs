const SHEETS = {
  PRODUCTS: "Products",
  BUNDLES: "Bundles",
  COMPONENTS: "BundleComponents",
  SALES_LOG: "SalesLog",
  SUMMARY: "Summary",
  SYNC_LOG: "SyncLog",
};

const HEADERS = {
  Products: [
    "product_id",
    "name",
    "price_cents",
    "cost_cents",
    "profit_cents",
    "category",
    "is_active",
    "sort_order",
    "updated_at",
  ],
  Bundles: [
    "bundle_id",
    "bundle_name",
    "bundle_price_cents",
    "bundle_cost_cents",
    "bundle_profit_cents",
    "is_active",
    "sort_order",
    "updated_at",
  ],
  BundleComponents: ["bundle_id", "product_id", "quantity", "updated_at"],
  SalesLog: [
    "batch_id",
    "sale_id",
    "timestamp",
    "item_type",
    "item_id",
    "item_name_snapshot",
    "unit_price_snapshot",
    "unit_cost_snapshot",
    "quantity",
    "revenue_snapshot",
    "cost_snapshot",
    "profit_snapshot",
    "bundle_component_breakdown_json",
    "device_id",
    "session_id",
    "processed_at",
  ],
  Summary: ["metric", "value", "updated_at"],
  SyncLog: [
    "batch_id",
    "device_id",
    "session_id",
    "checksum",
    "sale_count",
    "status",
    "processed_at",
    "note",
  ],
};

function doGet(e) {
  return handleRequest_({
    action: e && e.parameter && e.parameter.action ? e.parameter.action : "ping",
    payload:
      e && e.parameter && e.parameter.payload
        ? JSON.parse(e.parameter.payload)
        : {},
  });
}

function doPost(e) {
  const request = parseJson_(e && e.postData ? e.postData.contents : "{}");
  return handleRequest_(request || {});
}

function handleRequest_(request) {
  try {
    ensureSheets_();
    const action = String(request.action || "ping");
    const payload = request.payload || {};
    let data;

    switch (action) {
      case "ping":
        data = {
          ok: true,
          time: nowIso_(),
        };
        break;
      case "syncCatalog":
        data = syncCatalog_(payload.catalog);
        break;
      case "uploadSalesBatch":
        data = uploadSalesBatch_(payload.batch);
        break;
      case "getLatestSnapshot":
        data = getLatestSnapshot_();
        break;
      case "getTotals":
        data = getLatestSnapshot_().summary;
        break;
      default:
        throw new Error("Unknown action: " + action);
    }

    return jsonResponse_({
      ok: true,
      data: data,
    });
  } catch (error) {
    return jsonResponse_({
      ok: false,
      message: error && error.message ? error.message : String(error),
    });
  }
}

function syncCatalog_(catalog) {
  validateCatalog_(catalog);
  const updatedAt = nowIso_();

  writeSheetObjects_(SHEETS.PRODUCTS, HEADERS.Products, catalog.products.map(function (product) {
    return {
      product_id: product.productId,
      name: product.name,
      price_cents: toInt_(product.priceCents),
      cost_cents: toInt_(product.costCents),
      profit_cents: toInt_(product.profitCents),
      category: product.category,
      is_active: Boolean(product.isActive),
      sort_order: toInt_(product.sortOrder),
      updated_at: updatedAt,
    };
  }));

  writeSheetObjects_(SHEETS.BUNDLES, HEADERS.Bundles, catalog.bundles.map(function (bundle) {
    return {
      bundle_id: bundle.bundleId,
      bundle_name: bundle.bundleName,
      bundle_price_cents: toInt_(bundle.bundlePriceCents),
      bundle_cost_cents: toInt_(bundle.bundleCostCents),
      bundle_profit_cents: toInt_(bundle.bundleProfitCents),
      is_active: Boolean(bundle.isActive),
      sort_order: toInt_(bundle.sortOrder),
      updated_at: updatedAt,
    };
  }));

  writeSheetObjects_(
    SHEETS.COMPONENTS,
    HEADERS.BundleComponents,
    catalog.bundleComponents.map(function (component) {
      return {
        bundle_id: component.bundleId,
        product_id: component.productId,
        quantity: toInt_(component.quantity),
        updated_at: updatedAt,
      };
    }),
  );

  return {
    message: "Catalog synced to spreadsheet",
    productCount: catalog.products.length,
    bundleCount: catalog.bundles.length,
    bundleComponentCount: catalog.bundleComponents.length,
  };
}

function uploadSalesBatch_(batch) {
  validateBatch_(batch);
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const syncLogs = readSheetObjects_(SHEETS.SYNC_LOG);
    const processedLog = syncLogs.find(function (row) {
      return row.batch_id === batch.batchId && row.status === "PROCESSED";
    });

    if (processedLog) {
      return {
        alreadyProcessed: true,
        batchId: batch.batchId,
        message: "Batch already processed",
        snapshot: getLatestSnapshot_(),
      };
    }

    const salesRows = readSheetObjects_(SHEETS.SALES_LOG).filter(function (row) {
      return row.batch_id === batch.batchId;
    });

    if (salesRows.length > 0 && salesRows.length !== batch.sales.length) {
      throw new Error("Existing SalesLog batch row count mismatch for " + batch.batchId);
    }

    if (salesRows.length === 0) {
      appendSheetObjects_(
        SHEETS.SALES_LOG,
        HEADERS.SalesLog,
        batch.sales.map(function (sale) {
          return {
            batch_id: batch.batchId,
            sale_id: sale.id,
            timestamp: sale.timestamp,
            item_type: sale.itemType,
            item_id: sale.itemId,
            item_name_snapshot: sale.itemNameSnapshot,
            unit_price_snapshot: toInt_(sale.unitPriceSnapshot),
            unit_cost_snapshot: toInt_(sale.unitCostSnapshot),
            quantity: toInt_(sale.quantity),
            revenue_snapshot: toInt_(sale.revenueSnapshot),
            cost_snapshot: toInt_(sale.costSnapshot),
            profit_snapshot: toInt_(sale.profitSnapshot),
            bundle_component_breakdown_json: JSON.stringify(
              sale.bundleComponentBreakdown || [],
            ),
            device_id: batch.deviceId,
            session_id: batch.sessionId,
            processed_at: nowIso_(),
          };
        }),
      );
    }

    upsertSyncLog_({
      batch_id: batch.batchId,
      device_id: batch.deviceId,
      session_id: batch.sessionId,
      checksum: batch.checksum,
      sale_count: batch.sales.length,
      status: "PROCESSED",
      processed_at: nowIso_(),
      note: salesRows.length === 0 ? "Inserted new batch" : "Recovered existing batch rows",
    });

    rewriteSummarySheet_();

    return {
      alreadyProcessed: false,
      batchId: batch.batchId,
      message: "Batch processed",
      snapshot: getLatestSnapshot_(),
    };
  } finally {
    lock.releaseLock();
  }
}

function getLatestSnapshot_() {
  const products = readSheetObjects_(SHEETS.PRODUCTS);
  const bundles = readSheetObjects_(SHEETS.BUNDLES);
  const sales = readSalesLog_();
  const syncLogs = readSheetObjects_(SHEETS.SYNC_LOG)
    .sort(function (left, right) {
      return String(right.processed_at).localeCompare(String(left.processed_at));
    })
    .slice(0, 20)
    .map(function (row) {
      return {
        batchId: row.batch_id,
        deviceId: row.device_id,
        sessionId: row.session_id,
        checksum: row.checksum,
        saleCount: toInt_(row.sale_count),
        status: row.status,
        processedAt: row.processed_at,
        note: row.note || "",
      };
    });

  return {
    fetchedAt: nowIso_(),
    summary: summarizeSales_(sales),
    productSummaries: buildProductSummaries_(products, sales),
    bundleSummaries: buildBundleSummaries_(bundles, sales),
    syncLogs: syncLogs,
  };
}

function summarizeSales_(sales) {
  return sales.reduce(function (summary, sale) {
    summary.saleCount += 1;
    summary.revenueCents += toInt_(sale.revenueSnapshot);
    summary.costCents += toInt_(sale.costSnapshot);
    summary.profitCents += toInt_(sale.profitSnapshot);

    if (sale.itemType === "product") {
      summary.productSaleCount += 1;
      summary.productQuantity += toInt_(sale.quantity);
      summary.totalProductUnits += toInt_(sale.quantity);
    } else {
      summary.bundleSaleCount += 1;
      summary.bundleQuantity += toInt_(sale.quantity);
      const bundleDriven = sale.bundleComponentBreakdown.reduce(function (total, component) {
        return total + toInt_(component.quantity);
      }, 0);
      summary.bundleDrivenProductQuantity += bundleDriven;
      summary.totalProductUnits += bundleDriven;
    }

    return summary;
  }, {
    saleCount: 0,
    productSaleCount: 0,
    bundleSaleCount: 0,
    productQuantity: 0,
    bundleQuantity: 0,
    bundleDrivenProductQuantity: 0,
    totalProductUnits: 0,
    revenueCents: 0,
    costCents: 0,
    profitCents: 0,
  });
}

function buildProductSummaries_(products, sales) {
  const rows = {};

  products.forEach(function (product) {
    rows[product.product_id] = {
      productId: product.product_id,
      name: product.name,
      category: product.category || "未分類",
      directQuantity: 0,
      bundleDrivenQuantity: 0,
      totalQuantity: 0,
      revenueCents: 0,
      costCents: 0,
      profitCents: 0,
    };
  });

  sales.forEach(function (sale) {
    if (sale.itemType === "product") {
      const row = rows[sale.itemId] || {
        productId: sale.itemId,
        name: sale.itemNameSnapshot,
        category: "未分類",
        directQuantity: 0,
        bundleDrivenQuantity: 0,
        totalQuantity: 0,
        revenueCents: 0,
        costCents: 0,
        profitCents: 0,
      };
      row.directQuantity += toInt_(sale.quantity);
      row.totalQuantity += toInt_(sale.quantity);
      row.revenueCents += toInt_(sale.revenueSnapshot);
      row.costCents += toInt_(sale.costSnapshot);
      row.profitCents += toInt_(sale.profitSnapshot);
      rows[sale.itemId] = row;
      return;
    }

    sale.bundleComponentBreakdown.forEach(function (component) {
      const row = rows[component.productId] || {
        productId: component.productId,
        name: component.productNameSnapshot,
        category: "未分類",
        directQuantity: 0,
        bundleDrivenQuantity: 0,
        totalQuantity: 0,
        revenueCents: 0,
        costCents: 0,
        profitCents: 0,
      };
      row.bundleDrivenQuantity += toInt_(component.quantity);
      row.totalQuantity += toInt_(component.quantity);
      rows[component.productId] = row;
    });
  });

  return Object.keys(rows)
    .map(function (key) { return rows[key]; })
    .sort(function (left, right) {
      return right.totalQuantity - left.totalQuantity || left.name.localeCompare(right.name);
    });
}

function buildBundleSummaries_(bundles, sales) {
  const rows = {};

  bundles.forEach(function (bundle) {
    rows[bundle.bundle_id] = {
      bundleId: bundle.bundle_id,
      name: bundle.bundle_name,
      quantity: 0,
      revenueCents: 0,
      costCents: 0,
      profitCents: 0,
    };
  });

  sales.forEach(function (sale) {
    if (sale.itemType !== "bundle") {
      return;
    }

    const row = rows[sale.itemId] || {
      bundleId: sale.itemId,
      name: sale.itemNameSnapshot,
      quantity: 0,
      revenueCents: 0,
      costCents: 0,
      profitCents: 0,
    };
    row.quantity += toInt_(sale.quantity);
    row.revenueCents += toInt_(sale.revenueSnapshot);
    row.costCents += toInt_(sale.costSnapshot);
    row.profitCents += toInt_(sale.profitSnapshot);
    rows[sale.itemId] = row;
  });

  return Object.keys(rows)
    .map(function (key) { return rows[key]; })
    .sort(function (left, right) {
      return right.quantity - left.quantity || left.name.localeCompare(right.name);
    });
}

function rewriteSummarySheet_() {
  const summary = summarizeSales_(readSalesLog_());
  const updatedAt = nowIso_();
  const rows = Object.keys(summary).map(function (metric) {
    return {
      metric: metric,
      value: summary[metric],
      updated_at: updatedAt,
    };
  });
  writeSheetObjects_(SHEETS.SUMMARY, HEADERS.Summary, rows);
}

function readSalesLog_() {
  return readSheetObjects_(SHEETS.SALES_LOG).map(function (row) {
    return {
      id: row.sale_id,
      timestamp: row.timestamp,
      itemType: row.item_type,
      itemId: row.item_id,
      itemNameSnapshot: row.item_name_snapshot,
      unitPriceSnapshot: toInt_(row.unit_price_snapshot),
      unitCostSnapshot: toInt_(row.unit_cost_snapshot),
      quantity: toInt_(row.quantity),
      revenueSnapshot: toInt_(row.revenue_snapshot),
      costSnapshot: toInt_(row.cost_snapshot),
      profitSnapshot: toInt_(row.profit_snapshot),
      bundleComponentBreakdown: parseJson_(row.bundle_component_breakdown_json || "[]") || [],
    };
  });
}

function upsertSyncLog_(record) {
  const rows = readSheetObjects_(SHEETS.SYNC_LOG);
  const index = rows.findIndex(function (row) {
    return row.batch_id === record.batch_id;
  });
  if (index >= 0) {
    rows[index] = record;
  } else {
    rows.push(record);
  }
  writeSheetObjects_(SHEETS.SYNC_LOG, HEADERS.SyncLog, rows);
}

function validateCatalog_(catalog) {
  if (!catalog || !Array.isArray(catalog.products) || !Array.isArray(catalog.bundles) || !Array.isArray(catalog.bundleComponents)) {
    throw new Error("Invalid catalog payload");
  }
}

function validateBatch_(batch) {
  if (!batch || !batch.batchId || !Array.isArray(batch.sales) || !batch.deviceId || !batch.sessionId) {
    throw new Error("Invalid batch payload");
  }
}

function ensureSheets_() {
  const spreadsheet = getSpreadsheet_();
  ensureSheet_(spreadsheet, SHEETS.PRODUCTS, HEADERS.Products);
  ensureSheet_(spreadsheet, SHEETS.BUNDLES, HEADERS.Bundles);
  ensureSheet_(spreadsheet, SHEETS.COMPONENTS, HEADERS.BundleComponents);
  ensureSheet_(spreadsheet, SHEETS.SALES_LOG, HEADERS.SalesLog);
  ensureSheet_(spreadsheet, SHEETS.SUMMARY, HEADERS.Summary);
  ensureSheet_(spreadsheet, SHEETS.SYNC_LOG, HEADERS.SyncLog);
}

function getSpreadsheet_() {
  const activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (activeSpreadsheet) {
    return activeSpreadsheet;
  }

  const spreadsheetId = PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID");
  if (spreadsheetId && spreadsheetId.trim()) {
    return SpreadsheetApp.openById(spreadsheetId.trim());
  }

  throw new Error(
    "No spreadsheet connected. Bind this Apps Script to a Google Sheet, or set Script Property SPREADSHEET_ID.",
  );
}

function ensureSheet_(spreadsheet, name, headers) {
  let sheet = spreadsheet.getSheetByName(name);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(name);
  }
  const currentHeaders = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  if (currentHeaders.join("||") !== headers.join("||")) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
}

function readSheetObjects_(sheetName) {
  const sheet = getSpreadsheet_().getSheetByName(sheetName);
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) {
    return [];
  }
  const headers = values[0];
  return values.slice(1).map(function (row) {
    const object = {};
    headers.forEach(function (header, index) {
      object[header] = row[index];
    });
    return object;
  });
}

function writeSheetObjects_(sheetName, headers, objects) {
  const sheet = getSpreadsheet_().getSheetByName(sheetName);
  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).clearContent();
  }
  if (objects.length === 0) {
    return;
  }
  const rows = objects.map(function (object) {
    return headers.map(function (header) { return object[header]; });
  });
  sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
}

function appendSheetObjects_(sheetName, headers, objects) {
  const sheet = getSpreadsheet_().getSheetByName(sheetName);
  if (objects.length === 0) {
    return;
  }
  const rows = objects.map(function (object) {
    return headers.map(function (header) { return object[header]; });
  });
  sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, headers.length).setValues(rows);
}

function parseJson_(value) {
  try {
    return JSON.parse(value);
  } catch (error) {
    return null;
  }
}

function jsonResponse_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

function nowIso_() {
  return new Date().toISOString();
}

function toInt_(value) {
  return parseInt(value, 10) || 0;
}
