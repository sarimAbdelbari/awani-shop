# AwaniShop — Plan

Ce fichier résume l'architecture et les décisions techniques du projet. Pour le plan de sprints détaillé, voir `.cursor/plans/awanishop_sprint_plan_*.plan.md`.

## Stack

| Couche | Technologie |
|--------|-------------|
| Frontend | React 19 + Vite + Tailwind 4 + shadcn UI |
| Backend | Node.js + Express 5 + Mongoose |
| Base de données | MongoDB |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| i18n | Contexte React maison (FR/EN) |

## Architecture Serveur (MVC)

```
server/
├── config/db.js           ← connexion MongoDB
├── middleware/
│   ├── auth.middleware.js  ← vérification JWT
│   └── role.middleware.js  ← guard admin/cashier
├── models/                 ← schemas Mongoose
│   ├── User.js
│   ├── Client.js
│   ├── Product.js
│   ├── Order.js
│   ├── StockMovement.js
│   ├── Supplier.js
│   ├── Category.js
│   └── Settings.js
├── controllers/            ← logique métier
└── routes/                 ← endpoints REST
```

## Modèles de données

- **User** : nom, username, mot de passe hashé, rôle (admin | cashier)
- **Client** : nom complet, téléphone, points fidélité, total dépensé
- **Product** : nom, QR code, prix achat, prix vente, quantité, seuil alerte stock
- **Order** : client (optionnel), items (produit + qté + remise + total ligne), totaux
- **StockMovement** : produit, type (in | out), quantité, source, date
- **Supplier** : nom, téléphone, email, adresse
- **Category** : nom bilingue (fr + en)
- **Settings** : seuil fidélité (défaut 1000 DZD), récompense (défaut 50 DZD)

## Logique fidélité

Lors de la création d'une commande avec un client :
1. `client.totalSpent` est mis à jour
2. On calcule combien de seuils (`loyaltyThreshold`) ont été franchis
3. Pour chaque seuil franchi, `client.loyaltyPoints += loyaltyReward`

## Logique stock

Lors de la création d'une commande :
1. Stock vérifié avant création (erreur si insuffisant)
2. `product.quantity` décrémenté pour chaque article
3. Un `StockMovement` de type `out` est créé pour chaque article

## Rôles

- **Admin** : accès complet (CRUD, paramètres, stats, gestion utilisateurs)
- **Cashier** : création commandes, lecture clients/produits uniquement
