# AwaniShop — Suivi de Progression

## Sprint 0 — Fondation serveur ✅
- [x] `server/index.js` corrigé (CommonJS, ordre app, cors, dotenv)
- [x] `server/config/db.js` corrigé (mongoose importé)
- [x] Dépendances installées (dotenv, cors, bcryptjs, jsonwebtoken, nodemon, express-rate-limit)
- [x] Scripts `dev` et `start` ajoutés
- [x] Dossiers `routes/`, `controllers/`, `middleware/` créés
- [x] i18n maison (FR/EN) mis en place côté client
- [x] Fichiers PLAN.MD, PROGRESS.MD, CHAT.MD initialisés

## Sprint 1 — Modèles Mongoose ✅
- [x] User.js (avec hash bcrypt et comparePassword)
- [x] Client.js
- [x] Category.js (nom bilingue fr/en)
- [x] Supplier.js
- [x] Product.js (avec virtual isLowStock)
- [x] StockMovement.js
- [x] Order.js
- [x] Settings.js (singleton getSingleton())

## Sprint 2 — API REST complète ✅
- [x] auth : POST /login, POST /setup (premier admin), GET /me, CRUD /users
- [x] clients : CRUD complet, recherche par nom/téléphone
- [x] products : CRUD, recherche, filtre catégorie
- [x] orders : GET liste, GET détail, POST (avec stock + fidélité), GET /stats
- [x] stock : GET /movements, GET /alerts, POST /delivery, POST /adjust
- [x] suppliers : CRUD complet
- [x] categories : CRUD complet
- [x] settings : GET + PUT (singleton)
- [x] Middleware auth (JWT) et rôles

## Sprint 3 — Page Commandes / Factures (Frontend) ✅
- [x] Recherche produit par nom ou QR code
- [x] Ajout article à la facture (avec contrôle stock)
- [x] Modification quantité et remise par ligne
- [x] Calcul temps réel : sous-total, remise, total
- [x] Sélecteur client avec autocomplete
- [x] Soumission + toast de confirmation
- [x] Vue impression facture

## Sprint 4 — Produits, Stock, Fournisseurs, Catégories ✅
- [x] products-page : tableau, recherche, ajout/édition (Sheet), admin only pour prix achat
- [x] stock-page : onglets mouvements + alertes, livraison fournisseur
- [x] suppliers-page : CRUD simple
- [x] categories-page : CRUD avec noms FR/EN

## Sprint 5 — Clients, Dashboard, Auth, Paramètres ✅
- [x] login-page : formulaire connecté à l'API
- [x] AuthContext : JWT localStorage + rôle
- [x] clients-page : tableau + formulaire, points fidélité
- [x] dashboard-page : stats live (admin), graphique revenus, top produits
- [x] settings-page : seuil fidélité, récompense, gestion utilisateurs
- [x] Routes protégées (RequireAuth + RequireAdmin)

## Sprint 6 — i18n, Polish, Hardening ✅
- [x] Fichiers de traduction FR/EN complets
- [x] Toggle FR/EN dans la sidebar
- [x] NavUser connecté (logout, initiales, rôle)
- [x] Sidebar dynamique selon le rôle (admin voit plus d'entrées)
- [x] .env.example pour client et serveur

## À faire (futures itérations)
- [ ] Rate limiting sur /api/auth/login (express-rate-limit déjà installé)
- [ ] Validation serveur avec un schéma (joi ou express-validator)
- [ ] Tests unitaires et d'intégration
- [ ] Mode impression CSS (@media print) affiné
- [ ] PWA / mode offline
