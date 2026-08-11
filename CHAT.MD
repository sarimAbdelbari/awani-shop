# AwaniShop — Journal de Réflexion

Ce fichier sert d'espace de réflexion, de notes et de décisions de conception.

---

## 2026-06-01 — Décisions de Sprint 0

**Pourquoi CommonJS et pas ESM sur le serveur ?**
Le `package.json` serveur avait `"type": "commonjs"` et les modèles existants utilisaient `require()`. Plutôt que de migrer tout l'écosystème vers ESM (risque de casser les imports Mongoose), on reste sur CommonJS. Le client React est en ESM (Vite le gère).

**Pourquoi une i18n maison et pas i18next ?**
i18next n'était pas encore installé côté client. Plutôt que d'ajouter une dépendance lourde pour un besoin simple (FR/EN), on a fait un contexte React léger autour de fichiers JSON. La migration vers i18next est triviale si besoin.

---

## 2026-06-01 — Décisions de Sprint 1

**Logique fidélité dans le controller et non dans un hook Mongoose**
Un hook `post-save` Mongoose est difficile à déboguer et ne peut pas accéder facilement au singleton `Settings`. Le controller `order.controller.js` gère toute la logique de manière explicite et testable.

**`Settings` en singleton**
La boutique n'a qu'un seul jeu de paramètres. Le pattern `getSingleton()` crée le document s'il n'existe pas, évitant une migration initiale obligatoire.

---

## 2026-06-01 — Décisions de Sprint 3

**Page commandes = POS simplifié**
L'utilisateur cible est peu technique. L'interface ressemble à une caisse : recherche produit à gauche, facture et totaux à droite. Les produits s'ajoutent d'un clic, la remise est par ligne.

**Pas de dialog, utilisation de Sheet**
Le composant `Dialog` de shadcn n'était pas installé. `Sheet` (panneau latéral) s'adapte mieux aux tablettes et donne plus d'espace pour les formulaires.

---

## Notes ouvertes
- Penser à la gestion des retours/avoirs dans une prochaine itération
- Le QR code "scan" utilise pour l'instant l'input texte. Un vrai scan caméra (ZXing) peut être ajouté plus tard.
- L'impression est gérée avec `window.print()` + CSS `@media print`. Une lib comme `react-to-print` pourrait améliorer cela.
