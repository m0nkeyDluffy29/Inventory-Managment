## Expiry (Phase 3)

| Method | Path                   | Auth | Description                              |
| ------ | ---------------------- | ---- | ---------------------------------------- |
| GET    | /expiry/soon?days=7    | any  | Batches expiring within N days           |
| GET    | /expiry/stats          | any  | Summary counts (expired/today/3d/7d)     |
| POST   | /expiry/:batchId/waste | any  | Write off batch remaining qty as wastage |

## Alerts — extended (Phase 4)

| Method | Path                      | Auth  | Description                               |
| ------ | ------------------------- | ----- | ----------------------------------------- |
| GET    | /alerts/low-stock         | any   | Items where current_stock < caution_level |
| POST   | /alerts/trigger           | owner | Manually fire reorder email now           |
| POST   | /alerts/test-email        | owner | Send SMTP test email                      |
| PUT    | /alerts/caution-level/:id | owner | Update caution_level for one item         |

## Vendor Bills — extended (Phase 2)

| Method | Path                         | Auth | Description                                    |
| ------ | ---------------------------- | ---- | ---------------------------------------------- |
| PUT    | /vendor-bills/:id/line-items | any  | Save staff corrections to OCR line items       |
| POST   | /vendor-bills/scan           | any  | Upload bill image → OCR → returns pending bill |
