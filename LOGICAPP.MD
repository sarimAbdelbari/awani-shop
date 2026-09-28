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
| **Stock / inventaire** (réceptions A minus ventes, by product + lot + fournisseur) | **Done** |
| **Vente directe** (4 tickets, pile pick, ticket print) | **Done** |
| **Rapport de vente** (liste, CA, marge, résultat) | **Done** |
| **Caisse** (one open shift, écart) | **Done** |
| **Ajustements** (casse, perte, inventaire) | **Done** |
| **Frais** (admin, résultat = CA − frais) | **Done** |
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

**Not on product** (by design): buy price, sell price, quantity, supplier. Fournisseur is on the réception (and copied onto reception stock movements), not a product catalog.

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

- **A** → enters inventaire for that product + lot + fournisseur
- **R** → history only, **does not** increase stock
- Update allowed: stock is **recomputed** from all A lines (no quantity on Product)
- Stock movements (`source: 'reception'`) are rewritten on create/update/delete. Each `in` row copies the réception’s `supplier` (traceability). Order/manual movements leave `supplier` null.
- Same product can come from any fournisseur. Product has **no** supplier catalog field.

### Inventaire

On-hand = sum of **A** réception quantities minus qty sold, minus adjustment outs, plus adjustment ins, grouped by `(product, lot, supplier)`.
Same product in the same lot from two fournisseurs = two piles. Same fournisseur delivering twice still merges (qty summed).
Last buy/sell price, last réception number, and nearest expiry stay **per pile** (from réceptions). A fully sold pile stays visible at quantity 0.

### Vente directe

Up to **4 tickets** at once (F1–F4). Drafts stay in the browser until **Encaisser** (F9). Chrome Help on F1 is cancelled while the caisse is focused.

- Client optional (empty = comptoir). `*` search on name and phone. **F8** creates a client inline. Loyalty points are **shown only**, not awarded.
- Product search: accent-insensitive tokens split by `*` (`Assie*27*blanc`). Exact QR jumps to the pile step.
- Cashier **picks the pile** (lot + fournisseur) when more than one has qty. One sellable pile is selected automatically.
- **Prix de vente** (catalog, from the pile) is shown. **Prix réel** is what is charged. **Alt** shows prix d'achat and hides on release. Buy price is never printed.
- Qty is a whole number ≥ 1. The same pile across the 4 open tickets cannot exceed on-hand. The server checks again on save.
- Save writes `VNT-YYYY-0001`, an `out` stock movement (`source: 'order'`, with lot + fournisseur), prints the ticket, and clears that slot only. Each line stores `buyPrice` (the pile’s achat at sale time) so later réception prices do not rewrite the margin.

### Rapport de vente

Sidebar group **Vente**: Vente directe and Rapport de vente. Both cashiers and admins.

Rapport lists tickets between **date début** and **date fin** (default: this month through today). Table: ticket number, client (or Comptoir), date, total qty, prix réel. Column filters plus a global search. Eye or row click opens the lines (product, lot, fournisseur, qty, prix d'achat, prix de vente, prix réel, line total, line marge).

- **CA** = sum of ticket totals (prix réel) in the selected range. Rent and other bills are not inside CA.
- **Marge** = sum of `(prix réel − buyPrice) × qty`.
- **Résultat** = CA − frais dated in the same range.

### Statistiques

Admin home. **Today** stays today. The other cards and charts follow **date début** / **date fin** (default: the 1st of this month through today). CA, marge, and résultat use the same rules as the rapport. The day chart includes days with no sales. Top products are ranked by marge. Piles still holding 1 to 5 pieces are listed. Cashiers see shortcuts only.

### Caisse

One open shift for the shop. **Encaisser** is refused when the drawer is closed. Expected cash = fond + ticket totals since open. Close stores counted cash, expected cash, and écart (counted − expected).

### Ajustements

Casse and perte remove qty from one pile and need an observation. Inventaire sets a counted qty; the delta is in or out. A count equal to on-hand is rejected. No delete.

### Frais

Admin only: a **name**, plus loyer, électricité, eau, salaires, or autre. Edit and delete are allowed. They do not change stock or CA.

---

## Later slices

None of the planned shop slices above are left. Loyalty awarding is still undecided.

---

## Vente decisions (locked)

1. **Sell price:** catalog price from the pile is shown; the cashier types **prix réel** (defaults to catalog).
2. **Stock check on sale:** hard-block when qty > on-hand, including the other open tickets.
3. **Loyalty:** display points only. Do not award until the rule is confirmed.
4. **Pile on sale:** cashier picks lot + fournisseur when more than one pile can be sold.

---

## Seed

```bash
cd server
npm run seed
```

Clears & reloads **categories, products, suppliers, lots** (not users / clients / orders / réceptions).
