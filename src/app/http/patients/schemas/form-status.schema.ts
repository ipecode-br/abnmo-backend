export class PendingFormSchema {
  formType: string;

  missingFields: string[];
}

export class PatientFormsStatusSchema {
  patientId: number;

  patientName: string;

  pendingForms: PendingFormSchema[];

  completedForms: string[];
}
