import React, { useState } from 'react';
import { BackButton } from '../../ui/BackButton';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { MessageSquare, Phone, Send, CheckCircle2, User } from 'lucide-react';
import confetti from 'canvas-confetti';

interface CustomContactModalProps {
  onBack: () => void;
  defaultPhone?: string;
  defaultName?: string;
}

export const CustomContactModal: React.FC<CustomContactModalProps> = ({
  onBack,
  defaultPhone = '+237 699 45 61 28',
  defaultName = 'Awa Nkeng',
}) => {
  const [name, setName] = useState(defaultName);
  const [phone, setPhone] = useState(defaultPhone);
  const [city, setCity] = useState('Douala');
  const [goal, setGoal] = useState('Pflegeausbildung (Soins hospitaliers)');
  const [message, setMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 }
      });
    }, 600);
  };

  return (
    <div className="min-h-full flex flex-col justify-between p-5 bg-[#FAF7F2] animate-fade-in text-left">
      <div>
        <div className="mb-4">
          <BackButton onClick={onBack} title="Retour" />
        </div>

        {!isSubmitted ? (
          <div>
            <div className="mb-5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#C0512F] bg-[#FBEDE6] px-2.5 py-0.5 rounded">
                Accompagnement individuel
              </span>
              <h2 className="font-serif font-bold text-2xl text-[#241F18] mt-1.5">
                Gestion personnalisée
              </h2>
              <p className="text-xs text-[#8A8173]">
                Remplis tes coordonnées pour qu'un tuteur ou un conseiller d'orientation Mbeng te rappelle sous 24h.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
              <Input
                label="Nom et Prénom"
                value={name}
                onChange={(e) => setName(e.target.value)}
                leftElement={<User size={16} />}
              />

              <Input
                label="Numéro WhatsApp de contact"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                leftElement={<Phone size={16} />}
              />

              <div className="flex flex-col gap-1 text-left">
                <label className="text-xs font-semibold text-[#8A8173]">Ville de résidence actuelle</label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-white border border-[#E4DCCB] text-[#241F18] text-xs font-medium px-3.5 py-3 rounded-xl outline-none focus:border-[#C0512F]"
                >
                  <option value="Douala">Douala</option>
                  <option value="Yaoundé">Yaoundé</option>
                  <option value="Bafoussam">Bafoussam</option>
                  <option value="Autre région Cameroun">Autre région Cameroun</option>
                  <option value="Diaspora">Hors du Cameroun</option>
                </select>
              </div>

              <div className="flex flex-col gap-1 text-left">
                <label className="text-xs font-semibold text-[#8A8173]">Projet prioritaire visé</label>
                <select
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="w-full bg-white border border-[#E4DCCB] text-[#241F18] text-xs font-medium px-3.5 py-3 rounded-xl outline-none focus:border-[#C0512F]"
                >
                  <option value="Pflegeausbildung (Soins hospitaliers)">Formation soins (Pflegeausbildung)</option>
                  <option value="Préparation examen Goethe B1/B2">Préparation intensive examen Goethe / telc</option>
                  <option value="Ausbildung Technique / Hôtellerie">Ausbildung Technique / Métiers</option>
                  <option value="Études universitaires (Studium)">Études universitaires (Studium & Compte bloqué)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1 text-left">
                <label className="text-xs font-semibold text-[#8A8173]">Message ou précision particulière (facultatif)</label>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ex: J'ai déjà le niveau A2 et je recherche une clinique en Allemagne..."
                  className="w-full bg-white border border-[#E4DCCB] text-[#241F18] text-xs font-medium p-3.5 rounded-xl outline-none focus:border-[#C0512F] resize-none"
                />
              </div>

              <div className="pt-3">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  isLoading={isLoading}
                  rightIcon={<Send size={16} />}
                >
                  Envoyer ma demande
                </Button>
              </div>
            </form>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-[#DDF0E6] text-[#2F9E6E] flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="font-serif font-bold text-2xl text-[#241F18]">
              Demande enregistrée !
            </h3>
            <p className="text-xs text-[#8A8173] mt-2 max-w-xs mx-auto leading-relaxed">
              Merci {name}. Ton conseiller a reçu tes informations et te contactera sur WhatsApp au <strong className="text-[#241F18]">{phone}</strong>.
            </p>

            <div className="mt-8 flex flex-col gap-2">
              <Button
                variant="primary"
                size="md"
                fullWidth
                onClick={() => {
                  window.open(`https://wa.me/237699456128?text=Bonjour,%20je%20suis%20${encodeURIComponent(name)}%20et%20je%20souhaite%20un%20accompagnement%20Mon%20Projet%20Mbeng`, '_blank');
                }}
                leftIcon={<MessageSquare size={16} />}
              >
                Ouvrir WhatsApp directement
              </Button>
              <Button variant="secondary" size="md" fullWidth onClick={onBack}>
                Retour à l'application
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
