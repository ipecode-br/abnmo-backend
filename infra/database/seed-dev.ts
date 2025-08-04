import 'reflect-metadata';

import { faker } from '@faker-js/faker';

import { Patient } from '../../src/domain/entities/patient';
import { PatientSupport } from '../../src/domain/entities/patient-support';
import { User } from '../../src/domain/entities/user';
import dataSource from './data.source';

const DATABASE_DEV_NAME = 'abnmo_db';

async function main() {
  try {
    await dataSource.initialize();
    const dbName = dataSource.options.database;

    if (dbName !== DATABASE_DEV_NAME) {
      console.log(
        `❌ Execução negada. O banco atual não é o de desenvolvimento (${DATABASE_DEV_NAME})`,
      );
      process.exit(1);
    }

    console.log('🧹 Limpando banco de dados...');
    await dataSource.query('SET FOREIGN_KEY_CHECKS = 0');
    await dataSource.manager.clear(PatientSupport);
    await dataSource.manager.clear(Patient);
    await dataSource.manager.clear(User);
    await dataSource.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('✅ Dados antigos apagados.');

    console.log('📦 Executando migrations...');
    await dataSource.runMigrations();
    console.log('✅ Migrations executadas.');

    const userRepository = dataSource.getRepository(User);
    const patientRepository = dataSource.getRepository(Patient);
    const supportRepository = dataSource.getRepository(PatientSupport);

    const roles = ['admin', 'nurse', 'specialist', 'manager'] as const;

    console.log('👤 Criando usuários de sistema...');
    for (const role of roles) {
      const user = userRepository.create({
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: faker.internet.password(),
        role,
        avatar_url: faker.image.avatar(),
      });

      await userRepository.save(user);
      console.log(`✅ Usuário ${role} criado: ${user.email}`);
    }

    console.log('🧑‍⚕️ Criando 50 pacientes...');
    for (let i = 0; i < 50; i++) {
      const user = userRepository.create({
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: faker.internet.password(),
        role: 'patient',
        avatar_url: faker.image.avatar(),
      });

      await userRepository.save(user);

      const patient = patientRepository.create({
        user,
        gender: faker.helpers.arrayElement([
          'male_cis',
          'female_cis',
          'male_trans',
          'female_trans',
          'non_binary',
          'prefer_not_to_say',
        ]),
        date_of_birth: faker.date.birthdate({ min: 18, max: 80, mode: 'age' }),
        phone: faker.string.numeric(11),
        cpf: faker.string.numeric(11),
        state: 'PE',
        city: faker.location.city(),
        has_disability: faker.datatype.boolean(),
        disability_desc: faker.lorem.sentence(),
        need_legal_assistance: faker.datatype.boolean(),
        take_medication: faker.datatype.boolean(),
        medication_desc: faker.lorem.sentence(),
        has_nmo_diagnosis: faker.datatype.boolean(),
        status: 'active',
      });

      await patientRepository.save(patient);

      const supportCount = faker.number.int({ min: 0, max: 3 });
      for (let j = 0; j < supportCount; j++) {
        const support = supportRepository.create({
          patient: patient,
          name: faker.person.fullName(),
          phone: faker.string.numeric(11),
          kinship: faker.helpers.arrayElement([
            'pai',
            'mãe',
            'irmão',
            'cônjuge',
          ]),
        });

        await supportRepository.save(support);
      }

      console.log(
        `✅ Paciente ${i + 1} criado com ${supportCount} contato(s) de apoio`,
      );
    }

    console.log('🎉 Seed finalizado com sucesso.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Erro ao executar seed:', err);
    process.exit(1);
  }
}

void main();
