import React, { useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Submission } from '../types';
import { ArrowRightIcon, CheckIcon, SpinnerIcon, LockIcon } from './icons';

type StepID = 'participation' | 'feedback' | 'challenges_observed' | 'challenges_ranking' | 'challenges_evolution' | 'rupture_factors' | 'final_details';

interface QuestionnaireFormProps {
  onSubmit: (submission: Omit<Submission, 'id' | 'submittedAt'>) => void;
}

const professionalRoles = [
    "Animateur·trice socioculturel·le", "Assistant·e social·e", "Chargé·e d'accompagnement / d'insertion professionnelle",
    "Coach en insertion", "Conseiller·ère en formation", "Conseiller·ère en orientation", "Coordinateur·trice de projet",
    "Curateur·trice / Tuteur·trice professionnel·le", "Directeur·trice / Responsable de service", "Éducateur·trice social·e",
    "Enseignant·e", "Formateur·trice (en entreprise, atelier, etc.)", "Infirmier·ère", "Intervenant·e socio-éducatif·ve", 
    "Logopédiste / Spécialiste en troubles d'apprentissage", "Maître·sse socioprofessionnel·le", "Mentor·e en entreprise", 
    "Psychologue", "Psychopédagogue", "Représentant·e d'association professionnelle", "Travailleur·euse social·e", 
    "Travailleur·euse social·e hors murs (TSHM)", "Autre"
];

const challengesOptions = [
    {id: 'sante_mentale', label: 'Santé mentale'}, {id: 'precarite', label: 'Précarité économique et sociale'}, 
    {id: 'decrochage', label: 'Décrochage scolaire'}, {id: 'migration', label: 'Migration et intégration culturelle'}, 
    {id: 'addictions', label: 'Addictions'}, {id: 'conflits', label: 'Conflits familiaux'}, {id: 'autre', label: 'Autre'}
];

const ruptureFactorsFavorableOptions = [
    {id: 'accompagnement_individualise', label: 'Accompagnement individualisé renforcé'},
    {id: 'soutien_competences_base', label: 'Soutien aux compétences de base'},
    {id: 'stabilisation_situation', label: 'Stabilisation situation personnelle'},
    {id: 'adaptation_pedagogique', label: 'Adaptation pédagogique'},
    {id: 'soutien_financier_materiel', label: 'Soutien financier et matériel'},
    {id: 'orientation_adaptee', label: 'Orientation et projet adaptés'}
];

const ruptureFactorsNegativeOptions = [
    {id: 'lacunes_scolaires', label: 'Lacunes scolaires importantes'},
    {id: 'instabilite_psycho_sociale', label: 'Instabilité psycho-sociale'},
    {id: 'inadequation_orientation', label: 'Inadéquation orientation initiale'},
    {id: 'isolement_social', label: 'Isolement social et manque de pairs'},
    {id: 'difficultes_integration', label: 'Difficultés d\'intégration'},
    {id: 'demotivation_perte_sens', label: 'Démotivation et perte de sens'}
];

const renderQuestion = (title: string, children: React.ReactNode, subtitle?: string) => (
  <div className="mb-12 animate-slide-up" style={{ animationDelay: '150ms' }}>
    <div className="mb-6">
      <h3 className="text-xl sm:text-2xl font-display font-semibold text-foreground mb-2 leading-tight">
        {title}
      </h3>
      {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
    </div>
    {children}
  </div>
);

const NextButton = ({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) => (
  <div className="flex justify-end mt-10">
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="button-primary flex w-full sm:w-auto justify-center items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-lg"
    >
      <span>Suivant</span>
      <ArrowRightIcon className="w-5 h-5" />
    </button>
  </div>
);

const PreviousButton = ({ onClick }: { onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors duration-200 font-medium"
  >
    <ArrowRightIcon className="h-4 w-4 rotate-180" />
    <span>Retour</span>
  </button>
);

const NavigationButtons = ({ 
  onNext, 
  onPrevious, 
  canGoNext, 
  canGoPrevious, 
  isNextDisabled 
}: { 
  onNext: () => void; 
  onPrevious: () => void; 
  canGoNext: boolean; 
  canGoPrevious: boolean; 
  isNextDisabled?: boolean; 
}) => (
  <div className="flex justify-between items-center mt-10">
    <div>
      {canGoPrevious && <PreviousButton onClick={onPrevious} />}
    </div>
    <div>
      {canGoNext && (
        <button
          type="button"
          onClick={onNext}
          disabled={isNextDisabled}
          className="button-primary flex justify-center items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-lg px-8"
        >
          <span>Suivant</span>
          <ArrowRightIcon className="w-5 h-5" />
        </button>
      )}
    </div>
  </div>
);

const QuestionnaireForm: React.FC<QuestionnaireFormProps> = ({ onSubmit }) => {
  const { register, handleSubmit, watch, control, formState: { errors, isValid }, trigger } = useForm<Submission>({
    mode: 'onChange',
    defaultValues: {
        participatedInCafes: undefined,
        challengesRanking: { sante_mentale: 4, precarite: 4, decrochage: 4, migration: 4, addictions: 4, conflits: 4 }
    }
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const participated = watch('participatedInCafes');
  
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const stepsYes: StepID[] = ['participation', 'feedback', 'challenges_observed', 'challenges_ranking', 'challenges_evolution', 'rupture_factors', 'final_details'];
  const stepsNo: StepID[] = ['participation', 'challenges_observed', 'challenges_ranking', 'challenges_evolution', 'rupture_factors', 'final_details'];

  const currentPath = useMemo(() => {
    if (participated === 'Oui') return stepsYes;
    if (participated === 'Non') return stepsNo;
    return ['participation'];
  }, [participated]);

  const currentStepId = currentPath[currentStepIndex];
  const isLastStep = currentStepIndex === currentPath.length - 1;

  const handleNext = async () => {
    const fieldsToValidate: (keyof Submission | `challengesRanking.${string}` | `observedChallenges`)[] = [];

    switch(currentStepId) {
        case 'participation':
            fieldsToValidate.push('participatedInCafes');
            break;
        case 'feedback':
            fieldsToValidate.push('cafesKnowledge');
            fieldsToValidate.push('cafesCommunication');
            fieldsToValidate.push('cafesEnjoyment');
            break;
        case 'challenges_observed':
            fieldsToValidate.push('observedChallenges');
            break;
        case 'rupture_factors':
            // Validation conditionnelle : pas obligatoire si skip section activé
            const skipSection = watch('skipRuptureSection');
            if (!skipSection) {
                fieldsToValidate.push('ruptureFactorsFavorable');
                fieldsToValidate.push('ruptureFactorsNegative');
            }
            break;
    }

    const isStepValid = fieldsToValidate.length > 0 ? await trigger(fieldsToValidate) : true;
    
    if (isStepValid && !isLastStep) {
        setCurrentStepIndex(prev => prev + 1);
        window.scrollTo(0, 0); // Scroll to top on step change
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
        setCurrentStepIndex(prev => prev - 1);
        window.scrollTo(0, 0); // Scroll to top on step change
    }
  };
  
  const onFormSubmit = async (data: Submission) => {
    setIsSubmitting(true);
    try {
        const submissionData: Omit<Submission, 'id' | 'submittedAt'> = {
            ...data,
            observedChallengesOther: data.observedChallenges?.includes('autre') ? data.observedChallengesOther : undefined,
            professionalRoleOther: data.professionalRole === 'Autre' ? data.professionalRoleOther : undefined,
            cafesCommunicationReason: data.cafesCommunication === 'Non' ? data.cafesCommunicationReason : undefined,
            cafesEnjoymentOther: data.cafesEnjoyment?.includes('autre') ? data.cafesEnjoymentOther : undefined,
        };
        await onSubmit(submissionData);
    } catch (error) {
        console.error("Submission failed", error);
        // Here you could set an error state to show a global error message
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const renderSectionHeader = (title: string, description?: string) => (
    <div className="mb-8 sm:mb-10 text-center animate-fade-in">
      <h2 className="text-3xl sm:text-4xl font-display font-bold bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent mb-4">
        {title}
      </h2>
      {description && (
        <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto text-balance">
          {description}
        </p>
      )}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 sm:space-y-12">
      <div className="text-center animate-fade-in px-4">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-extrabold mb-4 leading-tight">
            <span className="bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent">Partagez votre expertise</span>
        </h1>
        <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed text-balance max-w-3xl mx-auto">
            Votre retour sur les "Cafés Partenaires" et votre vision des défis actuels participent à construire ensemble des réponses adaptées pour les jeunes en rupture.
        </p>
      </div>

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-8 sm:space-y-12">
        <div className="glass-card p-6 sm:p-8 md:p-12 animate-scale-in">
            {currentStepId === 'participation' && (
                <>
                    {renderQuestion(
                    "Avez-vous déjà participé à un ou plusieurs cafés partenaires de CAP Formations ?",
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto">
                        {['Oui', 'Non'].map(option => (
                        <label key={option} className={`relative group cursor-pointer transition-all duration-300 ${
                            participated === option ? 'transform scale-105' : 'hover:scale-102'
                        }`}>
                            <input 
                            type="radio" 
                            value={option} 
                            {...register("participatedInCafes", { required: "Veuillez répondre à cette question." })} 
                            className="sr-only" 
                            />
                            <div className={`
                            p-5 sm:p-6 rounded-xl text-center font-bold text-lg transition-all duration-300 border-2
                            ${participated === option
                                ? 'bg-primary text-primary-foreground border-primary/50 shadow-glow' 
                                : 'bg-background/80 text-foreground border-border hover:border-primary/50 hover:shadow-md group-hover:bg-card'
                            }
                            `}>
                            {option}
                            </div>
                        </label>
                        ))}
                    </div>
                    )}
                    
                    {errors.participatedInCafes && (
                    <div className="text-center mt-6 animate-slide-up">
                        <p className="text-destructive-foreground font-medium bg-destructive/80 px-4 py-2 rounded-lg inline-block text-sm">
                        {errors.participatedInCafes.message}
                        </p>
                    </div>
                    )}

          <div className="text-center mt-8 text-xs text-muted-foreground flex items-center justify-center gap-2 italic">
            <LockIcon className="w-4 h-4" />
            <span>Votre participation est confidentielle. L'e-mail sert uniquement à éviter les doublons et n'apparaît pas dans les résultats.</span>
          </div>

                    <NavigationButtons 
                        onNext={handleNext} 
                        onPrevious={handlePrevious}
                        canGoNext={!!participated} 
                        canGoPrevious={currentStepIndex > 0} 
                        isNextDisabled={!participated}
                    />
                </>
            )}

            {currentStepId === 'feedback' && (
                <>
                    {renderSectionHeader("Retour sur les Cafés Partenaires")}
                    
                    {renderQuestion("Les cafés partenaires vous ont-ils permis de mieux connaître les équipes de CAP Formations ou d'autres partenaires du réseau ?", (
                        <div className="space-y-4">
                            {[{id: 'equipes', label: 'L’équipe de CAP Formations'}, {id: 'partenaires', label: 'D’autres partenaires du réseau'}].map(opt => (
                                <label key={opt.id} className="flex items-center p-4 rounded-lg bg-card/80 hover:bg-card cursor-pointer border border-border transition-all">
                                    <Controller
                                        name="cafesKnowledge"
                                        control={control}
                                        render={({ field }) => (
                                            <div className="relative flex items-center">
                                                <input type="checkbox" id={`knowledge-${opt.id}`} className="peer sr-only" value={opt.id} checked={field.value?.includes(opt.id)}
                                                    onChange={e => {
                                                        const newValues = e.target.checked ? [...(field.value || []), opt.id] : field.value?.filter(v => v !== opt.id);
                                                        field.onChange(newValues);
                                                    }}
                                                />
                                                <div className="w-6 h-6 rounded-md border-2 border-border peer-checked:border-primary peer-checked:bg-primary flex items-center justify-center transition-all duration-200">
                                                    <CheckIcon className="w-4 h-4 text-primary-foreground transform scale-0 peer-checked:scale-100 transition-transform duration-200" />
                                                </div>
                                                <span className="ml-4 text-foreground font-medium">{opt.label}</span>
                                            </div>
                                        )}
                                    />
                                </label>
                            ))}
                        </div>
                    ))}

                    {renderQuestion("Pensez-vous que les cafés partenaires facilitent la communication et la collaboration entre les différents acteurs du réseau ?", (
                        <div className="space-y-4">
                             {['Oui', 'Non'].map(option => (
                                <label key={option} className="flex items-center p-4 rounded-lg bg-card/80 hover:bg-card cursor-pointer border border-border transition-all">
                                    <input type="radio" {...register("cafesCommunication", { required: "Veuillez sélectionner une option." })} value={option} className="sr-only" />
                                     <div className="w-6 h-6 rounded-full border-2 border-border flex items-center justify-center transition-all duration-200 mr-4">
                                        <div className={`w-3 h-3 rounded-full bg-primary transform scale-0 ${watch('cafesCommunication') === option ? 'scale-100' : ''} transition-transform duration-200`}></div>
                                    </div>
                                    <span className="text-foreground font-medium">{option}</span>
                                </label>
                            ))}
                            {errors.cafesCommunication && <p className="text-destructive text-sm mt-2">{errors.cafesCommunication.message}</p>}
                            {watch('cafesCommunication') === 'Non' && (
                                <textarea {...register("cafesCommunicationReason")} placeholder="Pour quelles raisons ?" rows={3} className="w-full mt-3 p-3 border border-border rounded-lg bg-card/80 focus:ring-2 focus:ring-primary/50 focus:border-primary/50 animate-slide-down"></textarea>
                            )}
                        </div>
                    ))}
                    
                    {renderQuestion("Qu'avez-vous le plus apprécié lors de ces rencontres ?", (
                         <div className="space-y-4">
                            {[{id: 'decouverte', label: 'La découverte d’autres structures'}, {id: 'discussion', label: 'La discussion libre sur une thématique'}, {id: 'informels', label: 'Les moments informels'}, {id: 'autre', label: 'Autre'}].map(opt => (
                                <div key={opt.id}>
                                    <label className="flex items-center p-4 rounded-lg bg-card/80 hover:bg-card cursor-pointer border border-border transition-all">
                                        <Controller
                                            name="cafesEnjoyment"
                                            control={control}
                                            render={({ field }) => (
                                                <div className="relative flex items-center">
                                                    <input type="checkbox" id={`enjoyment-${opt.id}`} className="peer sr-only" value={opt.id} checked={field.value?.includes(opt.id)}
                                                        onChange={e => {
                                                            const newValues = e.target.checked ? [...(field.value || []), opt.id] : field.value?.filter(v => v !== opt.id);
                                                            field.onChange(newValues);
                                                        }}
                                                    />
                                                    <div className="w-6 h-6 rounded-md border-2 border-border peer-checked:border-primary peer-checked:bg-primary flex items-center justify-center transition-all duration-200">
                                                        <CheckIcon className="w-4 h-4 text-primary-foreground transform scale-0 peer-checked:scale-100 transition-transform duration-200" />
                                                    </div>
                                                    <span className="ml-4 text-foreground font-medium">{opt.label}</span>
                                                </div>
                                            )}
                                        />
                                    </label>
                                    {opt.id === 'autre' && watch('cafesEnjoyment')?.includes('autre') && (
                                        <input type="text" {...register("cafesEnjoymentOther")} placeholder="Précisez..." className="w-full mt-3 p-3 border border-border rounded-lg bg-card/80 focus:ring-2 focus:ring-primary/50 focus:border-primary/50 animate-slide-down" />
                                    )}
                                </div>
                            ))}
                        </div>
                    ))}

                    <NavigationButtons 
                        onNext={handleNext} 
                        onPrevious={handlePrevious}
                        canGoNext={true} 
                        canGoPrevious={currentStepIndex > 0}
                        isNextDisabled={!watch('cafesKnowledge')?.length || !watch('cafesCommunication') || !watch('cafesEnjoyment')?.length}
                    />
                </>
            )}

            {currentStepId === 'challenges_observed' && (
                <>
                    {renderSectionHeader("Perception des problématiques des jeunes", "Votre expertise nous est précieuse pour affiner notre compréhension.")}
                    {renderQuestion("Parmi ces défis, lesquels observez-vous le plus souvent ?", (
                        <div className="space-y-2">
                            <p className="text-sm text-muted-foreground mb-4">Sélectionnez maximum 3 défis</p>
                            <div className="space-y-4">
                        {challengesOptions.map(opt => (
                          <div key={opt.id}>
                            <label className={`flex items-center p-4 rounded-lg border transition-all ${
                                (watch('observedChallenges')?.length || 0) < 3 || watch('observedChallenges')?.includes(opt.id)
                                    ? 'bg-card/80 hover:bg-card cursor-pointer border-border' 
                                    : 'bg-muted/30 cursor-not-allowed border-muted'
                            }`}>
                               <Controller
                                name="observedChallenges"
                                control={control}
                                rules={{ required: "Veuillez sélectionner au moins un défi." }}
                                render={({ field }) => {
                                    const currentValues = field.value || [];
                                    const isChecked = currentValues.includes(opt.id);
                                    const canCheck = currentValues.length < 3 || isChecked;
                                    
                                    return (
                                  <div className="relative flex items-center">
                                    <input 
                                      type="checkbox" 
                                      id={`challenge-${opt.id}`}
                                      className="peer sr-only"
                                      value={opt.id}
                                      checked={isChecked}
                                      disabled={!canCheck}
                                      onChange={e => {
                                        const newValues = e.target.checked
                                          ? [...currentValues, opt.id]
                                          : currentValues.filter(v => v !== opt.id);
                                        field.onChange(newValues);
                                      }}
                                    />
                                    <div className="w-6 h-6 rounded-md border-2 border-border peer-checked:border-primary peer-checked:bg-primary flex items-center justify-center transition-all duration-200">
                                       <CheckIcon className="w-4 h-4 text-primary-foreground transform scale-0 peer-checked:scale-100 transition-transform duration-200" />
                                    </div>
                                    <span className={`ml-4 font-medium ${canCheck ? 'text-foreground' : 'text-muted-foreground'}`}>{opt.label}</span>
                                  </div>
                                );
                                }}
                              />
                            </label>
                            {opt.id === 'autre' && watch('observedChallenges')?.includes('autre') && (
                              <input type="text" {...register("observedChallengesOther")} placeholder="Précisez..." className="w-full mt-3 p-3 border border-border rounded-lg bg-card/80 focus:ring-2 focus:ring-primary/50 focus:border-primary/50 animate-slide-down" />
                            )}
                          </div>
                        ))}
                            </div>
                        </div>
                    ), "Maximum 3 choix")}
                     <NavigationButtons 
                        onNext={handleNext} 
                        onPrevious={handlePrevious}
                        canGoNext={true} 
                        canGoPrevious={currentStepIndex > 0}
                        isNextDisabled={!watch('observedChallenges')?.length}
                    />
                </>
            )}

            {currentStepId === 'challenges_ranking' && (
                <>
                    {renderSectionHeader("Classement des Problématiques")}
                    {renderQuestion("Classez ces problématiques selon leur impact perçu sur les jeunes (1: Faible, 7: Majeur)", 
                        <div className="space-y-8">
                            {challengesOptions.filter(opt => opt.id !== 'autre').map(opt => (
                            <div key={opt.id} className="space-y-3">
                                <div className="flex items-center justify-between">
                                <span className="text-foreground font-medium">{opt.label}</span>
                                <span className="text-xl font-bold text-primary tabular-nums">
                                    {watch(`challengesRanking.${opt.id}`) || 4}
                                </span>
                                </div>
                                <Controller
                                    name={`challengesRanking.${opt.id}` as const}
                                    control={control}
                                    defaultValue={4}
                                    render={({ field: { onChange, value } }) => (
                                        <input
                                            type="range"
                                            min="1"
                                            max="7"
                                            step="1"
                                            value={value}
                                            onChange={onChange}
                                            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer modern-slider"
                                        />
                                    )}
                                />
                            </div>
                            ))}
                        </div>
                    )}
                    <NavigationButtons 
                        onNext={handleNext} 
                        onPrevious={handlePrevious}
                        canGoNext={true} 
                        canGoPrevious={currentStepIndex > 0}
                        isNextDisabled={false}
                    />
                </>
            )}
            
            {currentStepId === 'challenges_evolution' && (
                <>
                    {renderSectionHeader("Évolution des Problématiques", "Votre perspective sur les tendances est essentielle.")}
                    
                    {renderQuestion("Sur les 3-5 dernières années, quelles problématiques avez-vous perçues comme ayant nettement augmenté ou émergé ?", (
                        <div className="space-y-2">
                            <p className="text-sm text-muted-foreground mb-4">Sélectionnez maximum 3 problématiques</p>
                            <div className="space-y-4">
                            {challengesOptions.filter(opt => opt.id !== 'autre').map(opt => (
                                <label key={opt.id} className={`flex items-center p-4 rounded-lg border transition-all ${
                                    (watch('challengesHasEmerged')?.length || 0) < 3 || watch('challengesHasEmerged')?.includes(opt.id)
                                        ? 'bg-card/80 hover:bg-card cursor-pointer border-border' 
                                        : 'bg-muted/30 cursor-not-allowed border-muted'
                                }`}>
                                    <Controller
                                        name="challengesHasEmerged"
                                        control={control}
                                        render={({ field }) => {
                                            const currentValues = field.value || [];
                                            const isChecked = currentValues.includes(opt.id);
                                            const canCheck = currentValues.length < 3 || isChecked;
                                            
                                            return (
                                            <div className="relative flex items-center">
                                                <input type="checkbox" id={`emerged-${opt.id}`} className="peer sr-only" value={opt.id} checked={isChecked}
                                                    disabled={!canCheck}
                                                    onChange={e => {
                                                        const newValues = e.target.checked ? [...currentValues, opt.id] : currentValues.filter(v => v !== opt.id);
                                                        field.onChange(newValues);
                                                    }}
                                                />
                                                <div className="w-6 h-6 rounded-md border-2 border-border peer-checked:border-primary peer-checked:bg-primary flex items-center justify-center transition-all duration-200">
                                                    <CheckIcon className="w-4 h-4 text-primary-foreground transform scale-0 peer-checked:scale-100 transition-transform duration-200" />
                                                </div>
                                                <span className={`ml-4 font-medium ${canCheck ? 'text-foreground' : 'text-muted-foreground'}`}>{opt.label}</span>
                                            </div>
                                            );
                                        }}
                                    />
                                </label>
                            ))}
                            </div>
                        </div>
                    ), "Maximum 3 choix")}

                    {renderQuestion("Au-delà de cette liste, y a-t-il une nouvelle problématique majeure ou un phénomène nouveau que vous observez et qui vous semble important de signaler ?", (
                        <textarea {...register("emergingChallengesDescription")} rows={4} placeholder="Décrivez ici toute autre tendance ou phénomène émergent..." className="w-full p-4 border border-border rounded-lg bg-card/80 focus:ring-2 focus:ring-primary/50 focus:border-primary/50 resize-y" />
                    ))}

                    <NavigationButtons 
                        onNext={handleNext} 
                        onPrevious={handlePrevious}
                        canGoNext={true} 
                        canGoPrevious={currentStepIndex > 0}
                        isNextDisabled={!watch('challengesHasEmerged')?.length}
                    />
                </>
            )}
            
            {currentStepId === 'rupture_factors' && (
                <>
                    {renderSectionHeader("Facteurs de Rupture et Maintien en Formation", "Votre regard professionnel pour approfondir l'analyse des problématiques des jeunes en rupture.")}
                    
                    {/* Option pour passer la section */}
                    <div className="mb-8 p-6 bg-muted/50 rounded-lg border border-border">
                        <Controller
                            name="skipRuptureSection"
                            control={control}
                            render={({ field }) => (
                                <label className="flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={field.value || false}
                                        onChange={(e) => field.onChange(e.target.checked)}
                                        className="mr-3 h-4 w-4 text-primary border-border rounded focus:ring-primary"
                                    />
                                    <span className="text-muted-foreground">
                                        Je n'ai pas de contact direct avec des jeunes en rupture de formation
                                    </span>
                                </label>
                            )}
                        />
                    </div>

                    {!watch('skipRuptureSection') && (
                        <>
                            {renderQuestion("Selon votre expérience, quels facteurs facilitent le mieux la réussite du parcours de formation des jeunes en difficulté ?", (
                                <div className="space-y-2">
                                    <p className="text-sm text-muted-foreground mb-4">Sélectionnez maximum 3 facteurs</p>
                                    <div className="space-y-4">
                                        {ruptureFactorsFavorableOptions.map(opt => (
                                            <Controller
                                                key={opt.id}
                                                name="ruptureFactorsFavorable"
                                                control={control}
                                                render={({ field }) => {
                                                    const currentValues = field.value || [];
                                                    const isChecked = currentValues.includes(opt.id);
                                                    const canCheck = currentValues.length < 3 || isChecked;
                                                    
                                                    return (
                                                        <label className={`flex items-center p-4 rounded-lg border transition-all ${
                                                            canCheck ? 'bg-card/80 hover:bg-card cursor-pointer border-border' : 'bg-muted/30 cursor-not-allowed border-muted'
                                                        }`}>
                                                            <input 
                                                                type="checkbox" 
                                                                className="peer sr-only" 
                                                                value={opt.id} 
                                                                checked={isChecked}
                                                                disabled={!canCheck}
                                                                onChange={e => {
                                                                    const newValues = e.target.checked 
                                                                        ? [...currentValues, opt.id]
                                                                        : currentValues.filter(v => v !== opt.id);
                                                                    field.onChange(newValues);
                                                                }}
                                                            />
                                                            <div className="w-6 h-6 rounded-md border-2 border-border peer-checked:border-primary peer-checked:bg-primary flex items-center justify-center transition-all duration-200">
                                                                <CheckIcon className="w-4 h-4 text-primary-foreground transform scale-0 peer-checked:scale-100 transition-transform duration-200" />
                                                            </div>
                                                            <span className={`ml-4 font-medium ${canCheck ? 'text-foreground' : 'text-muted-foreground'}`}>
                                                                {opt.label}
                                                            </span>
                                                        </label>
                                                    );
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ), "Maximum 3 choix")}

                            {renderQuestion("D'après votre observation, quels facteurs compromettent le plus la réussite d'un parcours de formation ?", (
                                <div className="space-y-2">
                                    <p className="text-sm text-muted-foreground mb-4">Sélectionnez maximum 3 facteurs</p>
                                    <div className="space-y-4">
                                        {ruptureFactorsNegativeOptions.map(opt => (
                                            <Controller
                                                key={opt.id}
                                                name="ruptureFactorsNegative"
                                                control={control}
                                                render={({ field }) => {
                                                    const currentValues = field.value || [];
                                                    const isChecked = currentValues.includes(opt.id);
                                                    const canCheck = currentValues.length < 3 || isChecked;
                                                    
                                                    return (
                                                        <label className={`flex items-center p-4 rounded-lg border transition-all ${
                                                            canCheck ? 'bg-card/80 hover:bg-card cursor-pointer border-border' : 'bg-muted/30 cursor-not-allowed border-muted'
                                                        }`}>
                                                            <input 
                                                                type="checkbox" 
                                                                className="peer sr-only" 
                                                                value={opt.id} 
                                                                checked={isChecked}
                                                                disabled={!canCheck}
                                                                onChange={e => {
                                                                    const newValues = e.target.checked 
                                                                        ? [...currentValues, opt.id]
                                                                        : currentValues.filter(v => v !== opt.id);
                                                                    field.onChange(newValues);
                                                                }}
                                                            />
                                                            <div className="w-6 h-6 rounded-md border-2 border-border peer-checked:border-primary peer-checked:bg-primary flex items-center justify-center transition-all duration-200">
                                                                <CheckIcon className="w-4 h-4 text-primary-foreground transform scale-0 peer-checked:scale-100 transition-transform duration-200" />
                                                            </div>
                                                            <span className={`ml-4 font-medium ${canCheck ? 'text-foreground' : 'text-muted-foreground'}`}>
                                                                {opt.label}
                                                            </span>
                                                        </label>
                                                    );
                                                }}
                                            />
                                        ))}
                                    </div>

                                    {/* Champ libre unique pour facteurs supplémentaires */}
                                    <div className="mt-6 pt-4 border-t border-border">
                                        <label className="block text-sm font-medium text-foreground mb-2">
                                            Souhaitez-vous mentionner d'autres facteurs importants concernant la rupture/maintien en formation ?
                                        </label>
                                        <textarea 
                                            {...register("ruptureFactorsOther")} 
                                            rows={3} 
                                            placeholder="Facteurs supplémentaires (optionnel - max 200 caractères)..." 
                                            maxLength={200}
                                            className="w-full p-4 border border-border rounded-lg bg-card/80 focus:ring-2 focus:ring-primary/50 focus:border-primary/50 resize-y" 
                                        />
                                    </div>
                                </div>
                            ), "Maximum 3 choix")}
                        </>
                    )}

                    <NavigationButtons 
                        onNext={handleNext} 
                        onPrevious={handlePrevious}
                        canGoNext={true} 
                        canGoPrevious={currentStepIndex > 0}
                        isNextDisabled={!watch('skipRuptureSection') && (!watch('ruptureFactorsFavorable')?.length || !watch('ruptureFactorsNegative')?.length)}
                    />
                </>
            )}
            
            {currentStepId === 'final_details' && (
                <>
                 {renderSectionHeader("Finalisation")}
                 {renderQuestion("Dans votre pratique professionnelle, quels sont les principaux obstacles ou difficultés que vous rencontrez pour accompagner efficacement les jeunes ?", (
                    <textarea {...register("specializationObstacles")} rows={5} placeholder="Partagez votre expertise et vos observations de terrain..." className="w-full p-4 border border-border rounded-lg bg-card/80 focus:ring-2 focus:ring-primary/50 focus:border-primary/50 resize-y" />
                ))}

                <div className="mt-12 pt-8 border-t border-border/60">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {renderQuestion("Quel est votre rôle professionnel ?", (
                        <>
                        <select {...register("professionalRole", { required: "Veuillez sélectionner votre rôle." })} className="w-full p-4 border border-border rounded-lg bg-card/80 focus:ring-2 focus:ring-primary/50 focus:border-primary/50">
                            <option value="">-- Sélectionnez votre rôle --</option>
                            {professionalRoles.map(role => <option key={role} value={role}>{role}</option>)}
                        </select>
                        {errors.professionalRole && <p className="text-destructive mt-2 text-sm">{errors.professionalRole.message}</p>}
                        {watch('professionalRole') === 'Autre' && (
                            <input type="text" {...register("professionalRoleOther", { required: "Veuillez préciser votre rôle." })} placeholder="Veuillez préciser votre rôle" className="w-full mt-3 p-3 border border-border rounded-lg bg-card/80 focus:ring-2 focus:ring-primary/50 focus:border-primary/50 animate-slide-down" />
                        )}
                        {errors.professionalRoleOther && <p className="text-destructive mt-2 text-sm">{errors.professionalRoleOther.message}</p>}
                        </>
                    ))}
                    {renderQuestion("Veuillez entrer votre adresse e-mail pour soumettre.", (
                        <input type="email" {...register("email", { required: "Une adresse e-mail est requise.", pattern: { value: /^\S+@\S+\.\S+$/, message: "Adresse e-mail invalide." } })} placeholder="votre.email@example.com" className="w-full p-4 border border-border rounded-lg bg-card/80 focus:ring-2 focus:ring-primary/50 focus:border-primary/50" />
                    ))}
                </div>
                {errors.email && <p className="text-destructive text-center mt-2 text-sm">{errors.email.message}</p>}

                <button 
                    type="submit" 
                    disabled={isSubmitting || !isValid} 
                    className="w-full mt-8 button-primary text-lg sm:text-xl py-3 sm:py-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-lg flex items-center justify-center gap-3"
                >
                    {isSubmitting ? (
                        <>
                            <SpinnerIcon className="animate-spin h-5 w-5" />
                            <span>Soumission en cours...</span>
                        </>
                    ) : (
                        "Soumettre le questionnaire"
                    )}
                </button>
                </div>
                </>
            )}

        </div>
      </form>
    </div>
  );
};

export default QuestionnaireForm;
