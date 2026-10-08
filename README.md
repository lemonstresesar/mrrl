# HGD MediGest — Système Intégré de Gestion des Ressources Médicales
### Hôpital Général de Douala (Cameroun)
*Projet Académique de DUT — Informatique & Génie Médical (Données entièrement fictives)*

---

## 🏥 Présentation du Projet
**HGD MediGest** est une application web complète full-stack conçue pour optimiser et sécuriser la gestion des ressources médicales critiques de l'**Hôpital Général de Douala (HGD)** :
1. **Équipements biomédicaux & lits d'hospitalisation** (fiches techniques, statuts en temps réel, occupation des lits, étiquettes QR code prêtes à imprimer).
2. **Scanner QR Code** (via caméra smartphone ou saisie rapide) pour diagnostic et déclaration immédiate de panne.
3. **Pharmacie & Gestion des Stocks selon la règle FEFO** (*First Expired, First Out*) : priorité stricte aux lots proches de la péremption et **blocage automatique absolu des lots périmés**.
4. **Protocole sécurisé des Produits Contrôlés (Stupéfiants Tableau A)** : initiation par un Pharmacien, approbation conjointe par un Responsable Logistique (**deux utilisateurs distincts obligatoires**) et scellement dans un registre officiel infalsifiable avec signature cryptographique SHA-256.
5. **Maintenance biomédicale** : calendrier préventif, dépannage curatif d'urgence, alertes de dépassement d'échéance.
6. **Fournisseurs & Bons de commande** : catalogue des grossistes de Douala (Laborex, UCIPHARM, CAMEDIC), comparateur des délais et notations.
7. **Allocations & Transferts inter-services** : demandes des Chefs de Service avec mise à jour automatique de la localisation physique du matériel.
8. **Centre d'Alertes Hospitalières & Journal SMS simulé** : planificateur automatique (`node-cron`) générant les alertes de stock bas, péremptions imminentes (30 jours) et précoces (90 jours), retards de maintenance et pannes.
9. **Rapports médico-légaux & Exports certifiés** : génération instantanée de documents en PDF et feuilles de calcul Excel (XLSX).
10. **Journal d'Audit inviolable** : historisation de chaque modification sensible (utilisateur, action, IP, horodatage).

---

## 🔑 Comptes de Démonstration (Accès par Rôle)

Le système implémente un contrôle d'accès strict basé sur les rôles (**RBAC**) côté serveur sur chaque route de l'API. Sur la page de connexion, **des boutons d'accès en 1-clic** permettent aux évaluateurs de tester instantanément chaque profil :

| Rôle | Nom & Titre | Email | Mot de passe | Permissions & Responsabilités |
| :--- | :--- | :--- | :--- | :--- |
| **Administrateur** | Samuel Mbassi | `admin@hgd.cm` | `Admin123!` | Comptes utilisateurs, configuration système, journal d'audit complet, supervision globale. |
| **Responsable Logistique** | Chantal Ngo Bisseck | `logistique@hgd.cm` | `Logistique123!` | Équipements, lits, stocks, commandes fournisseurs, allocation inter-services, **validation des sorties de stupéfiants**. |
| **Pharmacien** | Dr. Jean-Marc Eyenga | `pharmacie@hgd.cm` | `Pharmacie123!` | Dépôt pharmacie, stocks FEFO, **initiation des sorties de produits contrôlés**, réceptions de lots. |
| **Technicien Maintenance** | Gervais Tchouassi | `maintenance@hgd.cm` | `Maintenance123!` | Maintenance biomédicale, interventions curatives/préventives, scan QR codes, rapports d'intervention. |
| **Chef de Service** | Pr. Alain Kamga (Urgences) | `chef.urgences@hgd.cm` | `Chef123!` | Demandes de ressources, consultation des disponibilités (lits/respirateurs), rapports de service. |

> *Note de sécurité : Tous les mots de passe sont salés et chiffrés à sens unique avec l'algorithme `bcrypt`.*

---

## 📐 Architecture Technique

### 1. Front-end
- **React 19** avec TypeScript
- **Tailwind CSS** (palette institutionnelle : Bleu marine `#1F3864`, Bleu médical `#2E74B5`, alertes vert/orange/rouge)
- **Bilinguisme intégral (Français / Anglais)** avec commutateur instantané
- **html5-qrcode** pour le scan par caméra
- **jspdf** et **jspdf-autotable** pour les exports PDF
- **xlsx** (SheetJS) pour les exports Excel

### 2. Back-end
- **Node.js** avec **Express**
- **Architecture en couches isolées** : `routes/`, `controllers/`, `services/`, `middleware/`, `data/`
- **Authentification par jeton JWT** (Bearer token, expiration 8 heures)
- **Contrôle d'accès RBAC** (`requireRole`) appliqué sur chaque route
- **Limiteur de tentatives de connexion** (protection anti brute-force)
- **En-têtes de sécurité Helmet**
- **Planificateur node-cron** (détection périodique des alertes)
- **Nodemailer** pour l'envoi d'emails réels via SMTP

### 3. Modèle Relationnel & Couche de Données Isolée
Toutes les entités respectent un schéma relationnel strict compatible **MySQL 8.0+ / MariaDB / Sequelize** :
- Le fichier `schema.sql` fourni à la racine contient la DDL complète (tables, clés primaires auto-incrémentées, contraintes de clés étrangères `FOREIGN KEY`, index de recherche, énumérations).
- La couche d'accès aux données dans `server/data/store.ts` isole tous les accès via une interface standard (Pattern Repository). Pour l'environnement AI Studio, le stockage est initialisé en mémoire et pré-rempli avec les données de l'Hôpital Général de Douala.
- Pour basculer sur une base MySQL locale avec Sequelize, il suffit de substituer les méthodes du store par les modèles Sequelize définis à partir de `schema.sql`.

---

## 💻 Installation et Exécution en Local

### Prérequis
- **Node.js** (version 20+ recommandée)
- **npm** ou **yarn**
- **MySQL** (version 8.0+ ou MariaDB) *(optionnel si vous utilisez le store intégré)*

### Étape 1 : Cloner et installer les dépendances
```bash
git clone <url-du-depot>
cd hgd-medigest
npm install
```

### Étape 2 : Configuration des variables d'environnement
Copiez le fichier `.env.example` en `.env` :
```bash
cp .env.example .env
```
Éditez le fichier `.env` selon vos besoins :
```ini
PORT=3000
JWT_SECRET=votre_cle_secrete_jwt_super_robuste

# Configuration SMTP pour envoi réel d'emails (Optionnel, ex: Mailtrap, Gmail, Brevo)
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=votre_identifiant_smtp
SMTP_PASS=votre_mot_de_passe_smtp
SMTP_FROM=alertes-ressources@hgd-douala.cm
```

### Étape 3 : (Optionnel) Initialisation de MySQL
Si vous souhaitez déployer la base de données relationnelle locale :
```bash
mysql -u root -p < schema.sql
```

### Étape 4 : Lancement de l'application
Pour démarrer le serveur Express avec le middleware Vite :
```bash
npm run dev
```
L'application est immédiatement accessible à l'adresse : **`http://localhost:3000`**.

---

## 🚀 Déploiement sur Netlify (Prêt à l'Emploi)

L'application est entièrement configurée pour un déploiement instantané sur **Netlify** grâce aux fichiers pré-configurés :
- `netlify.toml` (commande de build, dossier de publication, redirects API et SPA).
- `netlify/functions/api.ts` (API Express packagée en Serverless Function via `serverless-http`).
- `public/_redirects` (copié automatiquement dans `dist/_redirects`).

### Option A : Déploiement Continu via Git (Recommandé)
1. Poussez le projet sur **GitHub**, **GitLab** ou **Bitbucket**.
2. Connectez-vous sur [app.netlify.com](https://app.netlify.com) et cliquez sur **"Add new site" > "Import an existing project"**.
3. Sélectionnez votre dépôt : Netlify détecte automatiquement la configuration dans `netlify.toml` :
   - **Build command :** `npm run build`
   - **Publish directory :** `dist`
   - **Functions directory :** `netlify/functions`
4. Ajoutez vos variables d'environnement dans l'interface Netlify (*Site configuration > Environment variables*) :
   - `JWT_SECRET` = `votre_cle_secrete_jwt`
   - `NODE_VERSION` = `20`
5. Cliquez sur **Deploy site** : Votre application et son API REST serverless sont en ligne !

### Option B : Déploiement via Netlify CLI
```bash
npm install -g netlify-cli
npm run build
netlify deploy --prod
```

### Option C : Déploiement par Glisser-Déposer (Netlify Drop)
1. Exécutez le build local :
   ```bash
   npm run build
   ```
2. Rendez-vous sur [app.netlify.com/drop](https://app.netlify.com/drop).
3. Glissez-déposez simplement le dossier **`dist/`**.
4. Grâce au gestionnaire de fallback résilient intégré, l'application fonctionnera à 100% avec toutes ses données de démonstration et sa gestion FEFO !

---

## 🛡️ Règles Métier Clés Implémentées

### 1. Algorithme FEFO (First Expired, First Out)
Lors d'une sortie de stock de médicaments ou consommables :
1. Les lots actifs non périmés sont automatiquement ordonnés par date de péremption croissante.
2. Le prélèvement commence par le lot qui expire le plus tôt.
3. Si un lot est périmé (`date_peremption < date_du_jour`), le système **bloque impérativement** toute sortie avec un message explicite : *"BLOCAGE FEFO STRICT : Le lot est périmé depuis le [date]. Conformément aux protocoles hospitaliers, aucun lot périmé ne peut être distribué."*

### 2. Protocole Stupéfiants & Double Accord Conjoint
Les substances vénéneuses/contrôlées (Morphine injectable, Fentanyl) ne peuvent jamais sortir par simple clic :
1. Le **Pharmacien** initie la demande en saisissant l'ordonnance, le médecin prescripteur, la référence patient anonymisée et l'indication clinique.
2. La demande passe au statut `en_attente`.
3. Le **Responsable Logistique** examine la demande et la valide. **La règle des deux yeux interdit formellement que l'initiateur et le validateur soient le même compte.**
4. À la validation, un sceau SHA-256 scelle la transaction dans le registre médico-légal officiel en lecture seule pour tous.

---

## 🎓 Équipe et Cadre Académique
- **Établissement :** Institut Universitaire de Technologie (DUT)
- **Sujet :** Système d'Information Hospitalier & Gestion des Ressources Médicales
- **Partenaire d'Étude :** Hôpital Général de Douala (HGD), Makepe / Beedi, Douala, Cameroun.
