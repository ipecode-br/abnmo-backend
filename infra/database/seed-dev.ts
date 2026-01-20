import { faker } from '@faker-js/faker';
import { hash } from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';

import { Appointment } from '@/domain/entities/appointment';
import { Patient } from '@/domain/entities/patient';
import { PatientRequirement } from '@/domain/entities/patient-requirement';
import { PatientSupport } from '@/domain/entities/patient-support';
import { Referral } from '@/domain/entities/referral';
import { Token } from '@/domain/entities/token';
import { User } from '@/domain/entities/user';
import { APPOINTMENT_STATUSES } from '@/domain/enums/appointments';
import {
  PATIENT_REQUIREMENT_STATUSES,
  PATIENT_REQUIREMENT_TYPES,
} from '@/domain/enums/patient-requirements';
import {
  PATIENT_CONDITIONS,
  PATIENT_GENDERS,
  PATIENT_NMO_DIAGNOSTICS,
  PATIENT_STATUSES,
  type PatientStatus,
} from '@/domain/enums/patients';
import { REFERRAL_STATUSES } from '@/domain/enums/referrals';
import { SPECIALTY_CATEGORIES } from '@/domain/enums/shared';
import { USER_ROLES } from '@/domain/enums/users';

import dataSource from './data.source';

const DATABASE_DEV_NAME = 'abnmo_dev';

// Load cities from JSON files
const citiesByState: Record<string, string[]> = {};
const statesWithCities = ['AL', 'BA', 'CE', 'PA'] as const;
for (const state of statesWithCities) {
  const filePath = path.join(__dirname, 'utils', 'cities', `${state}.json`);
  const data = fs.readFileSync(filePath, 'utf-8');
  citiesByState[state] = JSON.parse(data) as string[];
}

function getRandomCity(state: string): string {
  const cities = citiesByState[state] || [];
  return faker.helpers.arrayElement(cities);
}

async function main() {
  const password = await hash('12345678', 10);

  try {
    await dataSource.initialize();
    const dbName = dataSource.options.database;

    if (dbName !== DATABASE_DEV_NAME) {
      console.log(
        '❌ Permission denied. The current database is not the development one.',
      );
      process.exit(1);
    }

    console.log('📦 Running migrations...');
    await dataSource.runMigrations();
    console.log('✅ Migrations completed.');

    console.log('🧹 Cleaning database...');
    await dataSource.query('SET FOREIGN_KEY_CHECKS = 0');
    await dataSource.manager.clear(PatientSupport);
    await dataSource.manager.clear(Appointment);
    await dataSource.manager.clear(Referral);
    await dataSource.manager.clear(PatientRequirement);
    await dataSource.manager.clear(Patient);
    await dataSource.manager.clear(User);
    await dataSource.manager.clear(Token);
    await dataSource.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✅ Old data deleted.');

    const usersRepository = dataSource.getRepository(User);
    const patientsRepository = dataSource.getRepository(Patient);
    const patientSupportsRepository = dataSource.getRepository(PatientSupport);
    const appointmentsRepository = dataSource.getRepository(Appointment);
    const referralsRepository = dataSource.getRepository(Referral);
    const patientRequirementsRepository =
      dataSource.getRepository(PatientRequirement);

    console.log('👤 Creating users...');
    for (const role of USER_ROLES) {
      const user = usersRepository.create({
        name: faker.person.fullName(),
        email: `${role}@ipecode.com.br`,
        password,
        role,
        avatar_url: faker.image.avatar(),
      });
      await usersRepository.save(user);
    }
    console.log('👤 Users created successfully...');

    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
    const fourMonthsAgo = new Date();
    fourMonthsAgo.setMonth(fourMonthsAgo.getMonth() - 4);

    const twoMonthsAhead = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() + 2);

    const patient = patientsRepository.create({
      name: faker.person.fullName(),
      email: 'patient@ipecode.com.br',
      password,
      avatar_url: faker.image.avatar(),
      status: 'active',
      gender: faker.helpers.arrayElement(PATIENT_GENDERS),
      date_of_birth: faker.date.birthdate({ min: 18, max: 80, mode: 'age' }),
      phone: faker.string.numeric(11),
      cpf: faker.string.numeric(11),
      state: 'BA',
      city: getRandomCity('BA'),
      has_disability: faker.datatype.boolean(),
      disability_desc: faker.lorem.sentence(),
      need_legal_assistance: faker.datatype.boolean(),
      take_medication: faker.datatype.boolean(),
      medication_desc: faker.lorem.sentence(),
      nmo_diagnosis: faker.helpers.arrayElement(PATIENT_NMO_DIAGNOSTICS),
      created_at: faker.date.between({ from: fourMonthsAgo, to: new Date() }),
    });
    await patientsRepository.save(patient);

    const totalOfPatients = 100;
    for (let i = 0; i < totalOfPatients; i++) {
      if ((i + 1) % 20 === 0) {
        console.log(`👥 Creating ${i + 1} patients...`);
      }

      const selectedState = faker.helpers.arrayElement(statesWithCities);

      // Set patient status: 10 pending, rest distributed among other statuses
      let patientStatus: PatientStatus;
      if (i < 10) {
        patientStatus = 'pending';
      } else {
        patientStatus = faker.helpers.arrayElement(
          PATIENT_STATUSES.filter((s) => s !== 'pending'),
        );
      }

      const newPatient = patientsRepository.create({
        name: faker.person.fullName(),
        email: faker.internet.email().toLowerCase(),
        password,
        avatar_url: faker.image.avatar(),
        status: patientStatus,
        gender: faker.helpers.arrayElement(PATIENT_GENDERS),
        date_of_birth: faker.date.birthdate({ min: 18, max: 80, mode: 'age' }),
        phone: faker.string.numeric(11),
        cpf: faker.string.numeric(11),
        state: selectedState,
        city: getRandomCity(selectedState),
        has_disability: faker.datatype.boolean(),
        disability_desc: faker.lorem.sentence(),
        need_legal_assistance: faker.datatype.boolean(),
        take_medication: faker.datatype.boolean(),
        medication_desc: faker.lorem.sentence(),
        nmo_diagnosis: faker.helpers.arrayElement(PATIENT_NMO_DIAGNOSTICS),
        created_at: faker.date.between({ from: fourMonthsAgo, to: new Date() }),
      });
      await patientsRepository.save(newPatient);

      const supportNetworkCount = faker.number.int({ min: 0, max: 3 });
      for (let j = 0; j < supportNetworkCount; j++) {
        const support = patientSupportsRepository.create({
          patient: newPatient,
          name: faker.person.fullName(),
          phone: faker.string.numeric(11),
          kinship: faker.helpers.arrayElement([
            'Pai',
            'Mãe',
            'Irmão',
            'Filho',
            'Avó',
          ]),
        });
        await patientSupportsRepository.save(support);
      }

      // Create between 0 and 2 appointments for each patient
      const appointmentCount = faker.number.int({ min: 0, max: 2 });
      for (let j = 0; j < appointmentCount; j++) {
        const appointment = appointmentsRepository.create({
          patient_id: newPatient.id,
          date: faker.date.between({ from: twoMonthsAgo, to: twoMonthsAhead }),
          status: faker.helpers.arrayElement(APPOINTMENT_STATUSES),
          category: faker.helpers.arrayElement(SPECIALTY_CATEGORIES),
          condition: faker.helpers.arrayElement(PATIENT_CONDITIONS),
          annotation: faker.datatype.boolean() ? faker.lorem.sentence() : null,
          professional_name: faker.person.fullName(),
          created_by: faker.string.uuid(),
          created_at: faker.date.between({
            from: fourMonthsAgo,
            to: new Date(),
          }),
        });
        await appointmentsRepository.save(appointment);
      }

      // Create between 0 and 2 referrals for each patient
      const referralCount = faker.number.int({ min: 0, max: 2 });
      for (let j = 0; j < referralCount; j++) {
        const referral = referralsRepository.create({
          patient_id: newPatient.id,
          date: faker.date.between({ from: twoMonthsAgo, to: twoMonthsAhead }),
          status: faker.helpers.arrayElement(REFERRAL_STATUSES),
          category: faker.helpers.arrayElement(SPECIALTY_CATEGORIES),
          condition: faker.helpers.arrayElement(PATIENT_CONDITIONS),
          annotation: faker.datatype.boolean() ? faker.lorem.sentence() : null,
          professional_name: faker.person.fullName(),
          created_by: faker.string.uuid(),
          created_at: faker.date.between({
            from: fourMonthsAgo,
            to: new Date(),
          }),
        });
        await referralsRepository.save(referral);
      }

      // Create between 0 and 2 requirements for each patient
      const requirementCount = faker.number.int({ min: 0, max: 2 });
      for (let j = 0; j < requirementCount; j++) {
        const status = faker.helpers.arrayElement(PATIENT_REQUIREMENT_STATUSES);
        const patientRequirement = patientRequirementsRepository.create({
          patient_id: newPatient.id,
          type: faker.helpers.arrayElement(PATIENT_REQUIREMENT_TYPES),
          title: faker.lorem.words(3),
          description: faker.lorem.sentence(),
          status,
          submitted_at:
            status === 'under_review'
              ? faker.date.between({ from: oneMonthAgo, to: new Date() })
              : null,
          approved_at:
            status === 'approved'
              ? faker.date.between({ from: twoMonthsAgo, to: new Date() })
              : null,
          created_by: faker.string.uuid(),
          created_at: faker.date.between({
            from: fourMonthsAgo,
            to: new Date(),
          }),
        });
        await patientRequirementsRepository.save(patientRequirement);
      }
    }

    console.log('🎉 Seed completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error executing seed:', err);
    process.exit(1);
  }
}

void main();
