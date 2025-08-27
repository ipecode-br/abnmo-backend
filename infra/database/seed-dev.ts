import { faker } from '@faker-js/faker';
import { hash } from 'bcryptjs';

import { BRAZILIAN_STATES } from '@/constants/brazilian-states';
import { GENDERS, PATIENT_STATUS } from '@/domain/schemas/patient';
import { USER_ROLES } from '@/domain/schemas/user';

import { Patient } from '../../src/domain/entities/patient';
import { PatientSupport } from '../../src/domain/entities/patient-support';
import { User } from '../../src/domain/entities/user';
import dataSource from './data.source';

const DATABASE_DEV_NAME = 'abnmo_dev';

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
    await dataSource.manager.clear(Patient);
    await dataSource.manager.clear(User);
    await dataSource.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✅ Old data deleted.');

    const userRepository = dataSource.getRepository(User);
    const patientRepository = dataSource.getRepository(Patient);
    const supportNetworkRepository = dataSource.getRepository(PatientSupport);

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

    console.log('👤 Creating 100 patients...');
    for (let i = 0; i < 100; i++) {
      const user = userRepository.create({
        name: faker.person.fullName(),
        email: faker.internet.email().toLocaleLowerCase(),
        password,
        role: 'patient',
        avatar_url: faker.image.avatar(),
      });
      await userRepository.save(user);

      const patient = patientRepository.create({
        user_id: user.id,
        gender: faker.helpers.arrayElement(GENDERS),
        date_of_birth: faker.date.birthdate({ min: 18, max: 80, mode: 'age' }),
        phone: faker.string.numeric(11),
        cpf: faker.string.numeric(11),
        state: faker.helpers.arrayElement(BRAZILIAN_STATES),
        city: faker.helpers.arrayElement([
          'São Paulo',
          'Rio de Janeiro',
          'Belo Horizonte',
          'Salvador',
          'Recife',
          'Fortaleza',
          'Curitiba',
          'Porto Alegre',
          'Manaus',
          'Belém',
        ]),
        has_disability: faker.datatype.boolean(),
        disability_desc: faker.lorem.sentence(),
        need_legal_assistance: faker.datatype.boolean(),
        take_medication: faker.datatype.boolean(),
        medication_desc: faker.lorem.sentence(),
        has_nmo_diagnosis: faker.datatype.boolean(),
        status: faker.helpers.arrayElement(PATIENT_STATUS),
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
    }

    console.log('🎉 Seed completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error executing seed:', err);
    process.exit(1);
  }
}

void main();
