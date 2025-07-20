export type FormType = 'triagem'; // Adicione outros no futuro: | 'anamnese' | 'consentimento'

export type PendingForm = {
  formType: FormType;
  missingFields: Array<
    | 'desc_gender'
    | 'birth_of_date'
    | 'city'
    | 'state'
    | 'whatsapp'
    | 'cpf'
    | 'url_photo'
    | 'have_disability'
    | 'need_legal_help'
    | 'use_medicine'
    | 'id_diagnostic'
    | 'support'
  >;
};

export type PatientFormsStatus = {
  patientId: number;
  patientName: string;
  pendingForms: PendingForm[];
  completedForms: FormType[];
};
