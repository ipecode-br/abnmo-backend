import { createHmac } from 'node:crypto';

import { faker } from '@faker-js/faker';
import { hash } from 'bcryptjs';
import dataSource from 'infra/database/data.source';
import { generateFakeSurvey } from 'infra/scripts/seed-dev/generate-fake-survey';
import { generateFakeSurveySubmission } from 'infra/scripts/seed-dev/generate-fake-survey-submission';
import { generateFakeUser } from 'infra/scripts/seed-dev/generate-fake-user';

import { Appointment } from '@/domain/entities/appointment';
import { PatientRequirement } from '@/domain/entities/patient-requirement';
import { Referral } from '@/domain/entities/referral';
import { Survey } from '@/domain/entities/survey';
import { SurveySubmission } from '@/domain/entities/survey-submission';
import { Token } from '@/domain/entities/token';
import { User } from '@/domain/entities/user';
import { SURVEY_STATUSES } from '@/domain/enums/surveys';
import { USER_ROLES } from '@/domain/enums/users';

const DATABASE_DEV_NAME = 'abnmo_dev';

async function main() {
  const pepper = process.env.HASH_PEPPER;
  const passwordWithPepper = createHmac('sha256', pepper || '')
    .update('12345678')
    .digest('base64');
  const password = await hash(passwordWithPepper, 14);

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
    await dataSource.manager.clear(Appointment);
    await dataSource.manager.clear(Referral);
    await dataSource.manager.clear(PatientRequirement);
    await dataSource.manager.clear(User);
    await dataSource.manager.clear(SurveySubmission);
    await dataSource.manager.clear(Survey);
    await dataSource.manager.clear(Token);
    await dataSource.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✅ Old data deleted.');

    const usersRepository = dataSource.getRepository(User);
    const surveySubmissionRepository =
      dataSource.getRepository(SurveySubmission);
    const surveyRepository = dataSource.getRepository(Survey);

    const ADMIN_USER = generateFakeUser(usersRepository, {
      password,
      role: 'admin',
      status: 'active',
    });
    await usersRepository.save(ADMIN_USER);

    // Members

    console.log('👤 Creating members...');
    for (const role of USER_ROLES) {
      const user = generateFakeUser(usersRepository, {
        email: `${role}@abnmo.org`,
        password,
        role,
        status: 'active',
      });
      await usersRepository.save(user);
    }

    // Specialists

    console.log('👤 Creating specialists...');
    const totalOfSpecialists = 4;
    for (let i = 0; i < totalOfSpecialists; i++) {
      const user = generateFakeUser(usersRepository, {
        password,
        role: 'specialist',
      });
      await usersRepository.save(user);
    }
    console.log(`✅ ${totalOfSpecialists} specialists created.`);

    // Survey submissions

    console.log('📝 Creating survey submissions...');
    const totalOfSubmissions = 5;
    for (let k = 0; k < totalOfSubmissions; k++) {
      const submission = generateFakeSurveySubmission(
        surveySubmissionRepository,
        { status: faker.helpers.arrayElement(['pending', 'denied']) },
      );
      await surveySubmissionRepository.save(submission);
    }
    console.log(`✅ ${totalOfSubmissions} survey submissions created.`);

    // Surveys

    console.log('📋 Creating surveys...');
    const totalOfSurveys = 10;
    for (let j = 0; j < totalOfSurveys; j++) {
      const surveyStatus = faker.helpers.arrayElement(SURVEY_STATUSES);

      const submission = generateFakeSurveySubmission(
        surveySubmissionRepository,
        {
          status: surveyStatus === 'completed' ? 'completed' : 'approved',
          approvedById: ADMIN_USER.id,
        },
      );
      await surveySubmissionRepository.save(submission);

      const user = generateFakeUser(usersRepository, {
        name: submission.name,
        email: submission.email,
        password,
        role: 'patient',
        status: 'active',
      });
      await usersRepository.save(user);

      const survey = generateFakeSurvey(surveyRepository, {
        userId: user.id,
        status: surveyStatus,
      });
      await surveyRepository.save(survey);
    }
    console.log(`✅ ${totalOfSurveys} surveys created.`);

    console.log('🎉 Seed completed.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error executing seed:', err);
    process.exit(1);
  }
}

void main();
