import { Patient } from '@/domain/entities/patient';
import { PendingForm } from '@/domain/types/form-types';

export const validateTriagemForm = (patient: Patient): PendingForm | null => {
  const missingFields: PendingForm['missingFields'] = [];

  if (!patient.gender) missingFields.push('desc_gender');
  if (!patient.date_of_birth) missingFields.push('birth_of_date');
  if (!patient.city) missingFields.push('city');
  if (!patient.state) missingFields.push('state');
  if (!patient.phone) missingFields.push('whatsapp');
  if (!patient.cpf) missingFields.push('cpf');
  if (patient.has_disability === undefined)
    missingFields.push('have_disability');
  if (patient.need_legal_assistance === undefined)
    missingFields.push('need_legal_help');
  if (patient.take_medication === undefined) missingFields.push('use_medicine');
  // if (!patient.id_diagnostic) missingFields.push('id_diagnostic');
  // if (!patient.support?.length) missingFields.push('support');

  return missingFields.length > 0
    ? {
        formType: 'triagem',
        missingFields,
      }
    : null;
};
