import React, { useState, useEffect } from 'react';
import {
  Settings,
  Users,
  Plus,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Building2,
  Sliders,
  Save,
} from 'lucide-react';
import { api } from '../services/api';
import { User, Service, UserRole } from '../types';
import { Modal } from '../components/Modal';

export const AdminView: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  // Modal Création Utilisateur
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('Hospital2026!');
  const [newNom, setNewNom] = useState('');
  const [newPrenom, setNewPrenom] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('logistique');
  const [newServiceId, setNewServiceId] = useState<number>(1);
  const [newTel, setNewTel] = useState('+237 6');
  const [userModalError, setUserModalError] = useState<string | null>(null);

  // Paramètres
  const [seuil90, setSeuil90] = useState('90');
  const [seuil30, setSeuil30] = useState('30');
  const [settingsSaved, setSettingsSaved] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [uRes, sRes, setRes] = await Promise.all([
        api.getUsers(),
        api.getServices(),
        api.getSettings(),
      ]);
      setUsers(uRes.users);
      setServices(sRes.services);
      setSettings(setRes.settings);
      if (setRes.settings.seuil_peremption_lointaine_jours) {
        setSeuil90(setRes.settings.seuil_peremption_lointaine_jours.valeur);
      }
      if (setRes.settings.seuil_peremption_urgente_jours) {
        setSeuil30(setRes.settings.seuil_peremption_urgente_jours.valeur);
      }
    } catch (e) {
      console.error('Erreur chargement admin', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleUserStatus = async (user: User) => {
    try {
      await api.toggleUserStatus(user.id, !user.active);
      await fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setUserModalError(null);
      await api.createUser({
        email: newEmail,
        password: newPassword,
        nom: newNom,
        prenom: newPrenom,
        role: newRole,
        service_id: Number(newServiceId),
        telephone: newTel,
      });
      setIsUserModalOpen(false);
      await fetchData();
    } catch (err: any) {
      setUserModalError(err.message || 'Erreur création compte');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await Promise.all([
        api.updateSetting('seuil_peremption_lointaine_jours', seuil90),
        api.updateSetting('seuil_peremption_urgente_jours', seuil30),
      ]);
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 3000);
      await fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Entête */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Settings className="w-6 h-6 text-[#2E74B5]" />
          <span>Administration Système & Paramètres de l'Hôpital</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Gestion des comptes autorisés, contrôle d'accès RBAC et configuration des seuils de péremption FEFO
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne Gauche (2/3) : Comptes utilisateurs */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#2E74B5]" />
              <span>Comptes Utilisateurs Hospitaliers ({users.length})</span>
            </h3>
            <button
              onClick={() => {
                setNewEmail('');
                setNewNom('');
                setNewPrenom('');
                setNewRole('logistique');
                setIsUserModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2E74B5] hover:bg-[#256199] text-white rounded-lg text-xs font-semibold transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nouveau Compte</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#1F3864] text-white font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Nom & Prénom</th>
                  <th className="py-2.5 px-3">Identifiant (Email)</th>
                  <th className="py-2.5 px-3">Rôle RBAC</th>
                  <th className="py-2.5 px-3">Statut</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      {u.prenom} {u.nom}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">{u.email}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded font-semibold text-[10px] bg-slate-100 text-slate-800">
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      {u.active ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center gap-1 w-fit">
                          <CheckCircle2 className="w-3 h-3" /> Actif
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px] flex items-center gap-1 w-fit">
                          <XCircle className="w-3 h-3" /> Inactif
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => handleToggleUserStatus(u)}
                        className={`text-[11px] font-semibold px-2 py-1 rounded transition ${
                          u.active
                            ? 'text-rose-600 hover:bg-rose-50'
                            : 'text-emerald-700 hover:bg-emerald-50'
                        }`}
                      >
                        {u.active ? 'Désactiver' : 'Réactiver'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Colonne Droite (1/3) : Paramètres d'Alerte FEFO */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#2E74B5]" />
              <span>Seuils d'Alerte de Péremption FEFO</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Configuration du planificateur automatique node-cron
            </p>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            {settingsSaved && (
              <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-lg font-semibold border border-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Paramètres institutionnels actualisés !</span>
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Délai d'alerte précoce de péremption (Jours) :
              </label>
              <input
                type="number"
                min="1"
                required
                value={seuil90}
                onChange={(e) => setSeuil90(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2E74B5] focus:outline-hidden font-bold"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Génère un avertissement orange dans le tableau de bord (par défaut : 90 jours).
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Délai d'alerte imminente / critique (Jours) :
              </label>
              <input
                type="number"
                min="1"
                required
                value={seuil30}
                onChange={(e) => setSeuil30(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2E74B5] focus:outline-hidden font-bold text-rose-700"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Déclenche une notification d'urgence SMS et email (par défaut : 30 jours).
              </span>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#1F3864] hover:bg-[#162a4d] text-white rounded-lg font-semibold shadow-md transition"
              >
                <Save className="w-4 h-4" />
                <span>Enregistrer la configuration</span>
              </button>
            </div>
          </form>

          {/* Rappel des 7 Services de l'HGD */}
          <div className="pt-3 border-t border-slate-100">
            <h4 className="font-bold text-xs text-slate-800 mb-2 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#2E74B5]" />
              <span>Services Déclarés (HGD Douala)</span>
            </h4>
            <div className="space-y-1 text-[11px] text-slate-600">
              {services.map((s) => (
                <div key={s.id} className="p-1.5 rounded bg-slate-50 flex justify-between">
                  <span className="font-semibold">{s.nom}</span>
                  <span className="font-mono text-slate-400">{s.code}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Création Utilisateur */}
      <Modal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        title="Créer un Compte Personnel Hospitalier"
        subtitle="Hôpital Général de Douala — Accès sécurisé par mot de passe chiffré bcrypt"
        maxWidth="md"
      >
        <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
          {userModalError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg font-medium">
              {userModalError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Prénom *</label>
              <input
                type="text"
                required
                value={newPrenom}
                onChange={(e) => setNewPrenom(e.target.value)}
                placeholder="Samuel"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2E74B5] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nom de famille *</label>
              <input
                type="text"
                required
                value={newNom}
                onChange={(e) => setNewNom(e.target.value)}
                placeholder="Mbassi"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2E74B5] focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Adresse Email Professionnelle *</label>
            <input
              type="email"
              required
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="prenom.nom@hgd.cm"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2E74B5] focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Mot de passe initial *</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2E74B5] focus:outline-hidden"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Le mot de passe sera salé et chiffré à sens unique avec l'algorithme bcrypt.
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Rôle et Permissions *</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2E74B5] focus:outline-hidden bg-white text-xs font-semibold"
              >
                <option value="admin">Administrateur</option>
                <option value="logistique">Responsable Logistique</option>
                <option value="pharmacien">Pharmacien</option>
                <option value="maintenance">Technicien Maintenance</option>
                <option value="chef_service">Chef de Service</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Service de rattachement</label>
              <select
                value={newServiceId}
                onChange={(e) => setNewServiceId(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2E74B5] focus:outline-hidden bg-white text-xs"
              >
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nom}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsUserModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#2E74B5] hover:bg-[#256199] text-white rounded-lg text-xs font-semibold shadow-md transition"
            >
              Créer le compte
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
