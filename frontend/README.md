# Healthcare Platform

Une plateforme de santé complète avec gestion des patients, des sessions thérapeutiques et des rapports médicaux.

## 🚀 Fonctionnalités

### 👤 Patients
- Inscription et connexion sécurisées
- Gestion du profil personnel (âge, genre, profession, etc.)
- Demande de sessions thérapeutiques
- Consultation de l'historique des sessions et rapports
- Réception de notifications des médecins
- Lecture des notes du médecin sur les rapports

### 👨‍⚕️ Médecins
- Gestion des patients assignés
- Approbation/rejet des demandes de sessions
- Consultation des rapports patients
- Ajout de notes et commentaires sur les rapports
- Notifications pour nouveaux rapports
- Vue d'ensemble de la pratique

### 🔧 Administrateurs
- Gestion complète des utilisateurs (patients, médecins)
- Vue d'ensemble de toutes les sessions et rapports
- Attribution des patients aux médecins
- Consultation des journaux d'audit
- Gestion des comptes (activation/désactivation)
- Contrôle d'accès basé sur les rôles

## 🛠️ Technologies Utilisées

- **Frontend**: React 18 avec TypeScript
- **Routing**: React Router DOM
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **Build Tool**: Vite
- **Linting**: ESLint

## 📦 Installation

1. Cloner le repository
```bash
git clone <repository-url>
cd healthcare-platform
```

2. Installer les dépendances
```bash
npm install
```

3. Lancer le serveur de développement
```bash
npm run dev
```

4. Ouvrir [http://localhost:5173](http://localhost:5173) dans votre navigateur

## 📱 Interface Utilisateur

### Design System
- **Couleurs primaires**: Bleu (#3B82F6), Vert teal (#10B981), Violet (#8B5CF6)
- **Typographie**: Système de polices moderne avec hiérarchie claire
- **Espacement**: Système basé sur 8px pour la cohérence
- **Animations**: Transitions subtiles et micro-interactions

### Responsive Design
- Optimisé pour desktop, tablette et mobile
- Navigation adaptative avec sidebar collapsible
- Grilles flexibles et composants adaptatifs

## 🏗️ Structure du Projet

```
src/
├── components/
│   └── common/           # Composants réutilisables
├── contexts/             # Contextes React (Auth, etc.)
├── pages/
│   ├── auth/            # Pages d'authentification
│   ├── patient/         # Interface patient
│   ├── doctor/          # Interface médecin
│   └── admin/           # Interface administrateur
├── services/            # Services API et utilitaires
├── types/               # Définitions TypeScript
└── App.tsx              # Composant principal

```

## 🔄 Modèles de Données

### Users
- `id`, `name`, `last_name`, `email`, `role`, `is_active`, `created_at`, etc.

### PatientProfiles  
- `user_id`, `age`, `gender`, `occupation`, `education_level`, `marital_status`, `notes`

### Sessions
- `id`, `patient_id`, `doctor_id`, `start_time`, `end_time`, `status`, `audio_transcript`

### Reports
- `id`, `session_id`, `content`, `summary`, `doctor_notes`, `notified_to_doctor`

### Notifications
- `id`, `user_id`, `type`, `message`, `is_read`, `created_at`

### ActionLogs
- `id`, `user_id`, `action_type`, `target_id`, `details`, `timestamp`

## 🚦 Workflow des Sessions

1. **Patient** : Demande une session (status: `pending`)
2. **Médecin** : Approuve ou rejette la demande
3. **Session approuvée** : Status devient `active`
4. **Après la session** : Status devient `completed`
5. **Rapport généré** : Le médecin peut ajouter des notes

## 🔔 Système de Notifications

- Notifications en temps réel pour tous les utilisateurs
- Types : demandes de session, rapports prêts, commentaires ajoutés
- Interface de notification avec compteur de non-lus
- Marquage automatique comme lu

## 🛡️ Sécurité

- Authentification basée sur les tokens
- Contrôle d'accès basé sur les rôles (RBAC)
- Routes protégées selon les permissions
- Validation des données côté client

## 📊 Fonctionnalités Avancées

- **Tableaux de bord** personnalisés par rôle
- **Recherche et filtrage** avancés
- **Modales interactives** pour les détails
- **Gestion d'état** optimisée avec Context API
- **Gestion d'erreurs** robuste
- **Loading states** pour une meilleure UX

## 🔧 Scripts Disponibles

- `npm run dev` - Serveur de développement
- `npm run build` - Build de production
- `npm run preview` - Aperçu du build
- `npm run lint` - Linting du code

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 📞 Support

Pour toute question ou problème, veuillez ouvrir une issue sur GitHub ou contacter l'équipe de développement.

---

**Note**: Cette application utilise des données mockées pour la démonstration. En production, elle devrait être connectée à une vraie API backend avec base de données.