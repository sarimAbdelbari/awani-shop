# AwaniShop — Application Logic

Living document for business rules and delivery status.

**Shop context:** Awani — kitchen / vaisselle (verres, couverts, casseroles, thé…). Algerian market (FR labels, NIF/NIS/RC on fournisseurs).

---

## Status (2026-08-23)

| Slice | Status |
|-------|--------|
| Auth (admin / cashier) | Done |
| **Données de base** (Clients, Fournisseurs, Produits, Catégories, **Lots**) | **Done** |
| Seed demo (DZ kitchenware + lots Magasin/Réserve) | Done (`server` → `npm run seed`) |
| **Achats / réceptions** | **Done** |
| **Stock / inventaire** (derived from accepted réceptions) | **Done** |
| Vente (POS + rapport) | Placeholder page only |
| Inventaire counts with reasons (casse, perte) | Not started |
| Caisse (shift cash) | Not started |
| Frais | Not started |

### Données de base — what shipped (UI / UX)

- CRUD dialogs per entity (create / update / view / delete)
- TanStack tables: search, column filters, sort, pagination (default **5** rows), column visibility
- Preferences persisted in `localStorage` (columns + page size)
- Header breadcrumb for master data: **Données de base → [icon] Entity**
- Product category picker: `react-select` (no `menuPortalTarget` / `menuPosition="fixed"`)
- Roles: cashier can use Clients / Produits (view+limited); Fournisseurs / Catégories admin-only

---

## Données de base (rules — implemented)

Master data for the rest of the shop: **Clients**, **Fournisseurs**, **Produits**, **Catégories**, **Lots**.

### Category

| Field | Rule |
|-------|------|
| `name` | Required, unique (case-insensitive) |
| `code` | Exactly **3 uppercase letters**, unique (e.g. `GLS`) |
| `nextProductSeq` | Internal counter for product codes (starts at `1`) |

### Product

| Field | Rule |
|-------|------|
| `code` | Auto: `{category.code}` + 4 digits → `GLS0001`. **Immutable** |
| `name` | Required. Unique among **active** products (case-insensitive) |
| `qrCode` | Optional barcode / référence |
| `category` | Required on create. **Locked** after create |
| `isActive` | Soft deactivate. Default `true` |

**Create:** category required → reject duplicate active name → assign code from seq → increment `nextProductSeq`.

**Update:** `name`, `qrCode` only.

**Deactivate / activate:** deactivate frees the name; activate rejects if another active product has the same name.

**Not on product** (moved to later slices): buy price, sell price, quantity, supplier link.

### Client

| Field | Rule |
|-------|------|
| `fullName` | Required |
| `phone` | Optional / nullable |
| `loyaltyPoints` | Default `0` (award rules with **Vente**) |

### Fournisseur (Supplier)

| Field | Rule |
|-------|------|
| `fullName` | Required |
| `phone` | Optional |
| `location` | Optional |
| `nif` / `nis` / `rc` | Optional (DZ fiscal / registre) |
| `email` | Optional |

### Lot (emplacement)

Physical place / named lot where goods are stored. Admin only.

| Field | Rule |
|-------|------|
| `code` | 2–8 letters/digits, unique, **locked** after create (e.g. `MAG`) |
| `name` | Required, unique (e.g. Magasin, Réserve) |
| `isActive` | Default `true` |

Cannot delete a lot used on a réception line.

---

## Achats — réceptions (implemented)

One **fournisseur** per réception (two suppliers = two documents).

### Réception

| Field | Rule |
|-------|------|
| `number` | Auto `RCP-YYYY-0001`. Assigned on create, never reused |
| `supplier` | Required. **One** per document |
| `note` | Optional |
| `createdAt` / `updatedAt` | Set automatically |

### Lines (1+)

| Field | Rule |
|-------|------|
| `product` | Required |
| `lot` | Required (from Données de base) |
| `quantity` | ≥ 1 |
| `status` | **A** (accepted) or **R** (rejected) |
| `buyPrice` / `sellPrice` | Required, ≥ 0 |
| `expiryDate` | Optional |
| `observation` | **Required if status is R** (e.g. verre cassé en route) |

- **A** → enters inventaire for that product + lot
- **R** → history only, **does not** increase stock
- Update allowed: stock is **recomputed** from all A lines (no quantity on Product)
- Stock movements (`source: 'reception'`) are rewritten on create/update/delete

### Inventaire

On-hand = sum of A quantities grouped by `(product, lot)`.
Shows last buy/sell price from the latest A line, nearest expiry if any.

---

## Later slices

### 1. **Next: Vente (POS + ticket + rapport léger)**

Now possible: stock exists after réceptions.

- Direct sale UI (search / pick products, qty, sell price on the line)
- Optional client + loyalty
- Decrement inventaire (A stock) on sale
- Ticket / print + simple CA report

### 2. Inventaire counts with reasons

- Adjustments (casse, perte, inventaire…) with observations

### 3. Caisse (shifts)

- Open / close shift, cash counted vs expected

### 4. Frais (expenses)

- Shop expenses for net margin later

---

## Open decisions (before coding Vente)

1. **Sell price:** last sell price from the lot/product réception, typed at sale, or both (default last, editable)?
2. **Stock check on sale:** warn / hard-block when qty > on-hand?
3. **Loyalty:** award on paid total now, or stub `loyaltyPoints` until rules are clear?

---

## Seed

```bash
cd server
npm run seed
```

Clears & reloads **categories, products, suppliers, lots** (not users / clients / orders / réceptions).
