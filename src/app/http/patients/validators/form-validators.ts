import { Patient } from '@/domain/entities/patient';
import { PendingForm } from '@/domain/types/form-types';

export const validateTriagemForm = (patient: Patient): PendingForm | null => {
  const missingFields: PendingForm['missingFields'] = [];

  if (!patient.desc_gender) missingFields.push('desc_gender');
  if (!patient.birth_of_date) missingFields.push('birth_of_date');
  if (!patient.city) missingFields.push('city');
  if (!patient.state) missingFields.push('state');
  if (!patient.whatsapp) missingFields.push('whatsapp');
  if (!patient.cpf) missingFields.push('cpf');
  if (!patient.url_photo) missingFields.push('url_photo');
  if (patient.have_disability === undefined)
    missingFields.push('have_disability');
  if (patient.need_legal_help === undefined)
    missingFields.push('need_legal_help');
  if (patient.use_medicine === undefined) missingFields.push('use_medicine');
  if (!patient.id_diagnostic) missingFields.push('id_diagnostic');
  if (!patient.support?.length) missingFields.push('support');

  return missingFields.length > 0
    ? {
        formType: 'triagem',
        missingFields,
      }
    : null;
};
