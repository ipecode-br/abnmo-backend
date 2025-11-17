import { faker } from '@faker-js/faker';
import { hash } from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';

import {
  APPOINTMENT_CONDITION,
  APPOINTMENT_STATUS,
} from '@/domain/schemas/appointment';
import { GENDERS, PATIENT_STATUS } from '@/domain/schemas/patient';
import {
  PATIENT_REQUIREMENT_STATUS,
  PATIENT_REQUIREMENT_TYPE,
} from '@/domain/schemas/patient-requirement';
import { USER_ROLES } from '@/domain/schemas/user';

import { Appointment } from '../../src/domain/entities/appointment';
import { Patient } from '../../src/domain/entities/patient';
import { PatientRequirement } from '../../src/domain/entities/patient-requirement';
import { PatientSupport } from '../../src/domain/entities/patient-support';
import { Specialist } from '../../src/domain/entities/specialist';
import { User } from '../../src/domain/entities/user';
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
    await dataSource.manager.clear(PatientRequirement);
    await dataSource.manager.clear(Patient);
    await dataSource.manager.clear(Specialist);
    await dataSource.manager.clear(User);
    await dataSource.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✅ Old data deleted.');

    const userRepository = dataSource.getRepository(User);
    const patientRepository = dataSource.getRepository(Patient);
    const supportNetworkRepository = dataSource.getRepository(PatientSupport);
    const specialistRepository = dataSource.getRepository(Specialist);
    const appointmentRepository = dataSource.getRepository(Appointment);
    const patientRequirementRepository =
      dataSource.getRepository(PatientRequirement);

    console.log('👤 Creating users...');
    for (const role of USER_ROLES) {
      const user = userRepository.create({
        name: faker.person.fullName(),
        email: `${role}@ipecode.com.br`,
        password,
        role,
        avatar_url: faker.image.avatar(),
      });
      await userRepository.save(user);
    }
    console.log('👤 Users created successfully...');

    const specialties = [
      'Cirurgia oncológica',
      'Cirurgia geral',
      'Cirurgia plástica',
      'Geriatria',
      'Mastologia',
      'Medicina preventiva e social',
      'Psiquiatria',
      'Radioterapia',
    ];

    console.log('👨‍⚕️ Creating 20 specialists...');
    const specialists: Specialist[] = [];
    for (let i = 0; i < 20; i++) {
      const user = userRepository.create({
        name: faker.person.fullName(),
        email: faker.internet.email().toLocaleLowerCase(),
        password,
        role: 'specialist',
        avatar_url: faker.image.avatar(),
      });
      await userRepository.save(user);

      const specialist = specialistRepository.create({
        user_id: user.id,
        specialty: faker.helpers.arrayElement(specialties),
        registry: faker.string.numeric(10),
        status: faker.helpers.arrayElement([
          'active',
          'inactive',
          'pending',
        ] as const),
      });
      const savedSpecialist = await specialistRepository.save(specialist);
      specialists.push(savedSpecialist);
    }
    console.log('👨‍⚕️ Specialists created successfully...');

    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
    const fourMonthsAgo = new Date();
    fourMonthsAgo.setMonth(fourMonthsAgo.getMonth() - 4);

    const totalOfPatients = 300;

    for (let i = 0; i < totalOfPatients; i++) {
      if ((i + 1) % 20 === 0) {
        console.log(`👥 Creating ${i + 1} patients...`);
      }

      const user = userRepository.create({
        name: faker.person.fullName(),
        email: faker.internet.email().toLocaleLowerCase(),
        password,
        role: 'patient',
        avatar_url: faker.image.avatar(),
      });
      await userRepository.save(user);

      const selectedState = faker.helpers.arrayElement(statesWithCities);

      const patient = patientRepository.create({
        user_id: user.id,
        gender: faker.helpers.arrayElement(GENDERS),
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
        has_nmo_diagnosis: faker.datatype.boolean(),
        status: faker.helpers.arrayElement(PATIENT_STATUS),
        created_at: faker.date.between({ from: fourMonthsAgo, to: new Date() }),
      });
      await patientRepository.save(patient);

      const supportNetworkCount = faker.number.int({ min: 0, max: 3 });
      for (let j = 0; j < supportNetworkCount; j++) {
        const support = supportNetworkRepository.create({
          patient: patient,
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
        await supportNetworkRepository.save(support);
      }

      // Create between 0 and 2 appointments for each patient
      const appointmentCount = faker.number.int({ min: 0, max: 2 });
      for (let j = 0; j < appointmentCount; j++) {
        const appointment = appointmentRepository.create({
          patient_id: patient.id,
          specialist_id: faker.helpers.arrayElement(specialists).id,
          date: faker.date.future(),
          status: faker.helpers.arrayElement(APPOINTMENT_STATUS),
          condition: faker.datatype.boolean()
            ? faker.helpers.arrayElement(APPOINTMENT_CONDITION)
            : null,
          annotation: faker.datatype.boolean() ? faker.lorem.sentence() : null,
        });
        await appointmentRepository.save(appointment);
      }

      // Create between 0 and 2 requirements for each patient
      const requirementCount = faker.number.int({ min: 0, max: 2 });
      for (let j = 0; j < requirementCount; j++) {
        const status = faker.helpers.arrayElement(PATIENT_REQUIREMENT_STATUS);
        const requirement = patientRequirementRepository.create({
          patient_id: patient.id,
          type: faker.helpers.arrayElement(PATIENT_REQUIREMENT_TYPE),
          title: faker.lorem.words(3),
          description: faker.lorem.sentence(),
          status,
          required_by: faker.string.uuid(),
          submitted_at:
            status === 'under_review'
              ? faker.date.between({ from: oneMonthAgo, to: new Date() })
              : new Date(),
          approved_at:
            status === 'approved'
              ? faker.date.between({ from: oneMonthAgo, to: new Date() })
              : null,
          created_at:
            status === 'pending'
              ? faker.date.between({ from: twoMonthsAgo, to: new Date() })
              : new Date(),
        });
        await patientRequirementRepository.save(requirement);
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
