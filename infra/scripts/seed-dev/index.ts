import { createHmac } from 'node:crypto';

import { faker } from '@faker-js/faker';
import { hash } from 'bcryptjs';
import dataSource from 'infra/database/data.source';
import { generateFakeAppointment } from 'infra/scripts/seed-dev/generate-fake-appointments';
import { generateFakeDocument } from 'infra/scripts/seed-dev/generate-fake-document';
import { generateFakeReferral } from 'infra/scripts/seed-dev/generate-fake-referrals';
import { generateFakeSurvey } from 'infra/scripts/seed-dev/generate-fake-survey';
import { generateFakeSurveySubmission } from 'infra/scripts/seed-dev/generate-fake-survey-submission';
import { generateFakeUser } from 'infra/scripts/seed-dev/generate-fake-user';

import { Appointment } from '@/domain/entities/appointment';
import { Document } from '@/domain/entities/document';
import { Referral } from '@/domain/entities/referral';
import { Survey } from '@/domain/entities/survey';
import { SurveySubmission } from '@/domain/entities/survey-submission';
import { User } from '@/domain/entities/user';
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

    console.log('🧹 Cleaning database...');
    await dataSource.query(
      'TRUNCATE TABLE appointments, referrals, documents, patient_requirements, survey_submissions, surveys, sessions, tokens, users CASCADE',
    );
    console.log('✅ Old data deleted.');

    console.log('📦 Running migrations...');
    await dataSource.runMigrations();
    console.log('✅ Migrations completed.');

    const usersRepository = dataSource.getRepository(User);
    const surveySubmissionRepository =
      dataSource.getRepository(SurveySubmission);
    const surveyRepository = dataSource.getRepository(Survey);
    const documentRepository = dataSource.getRepository(Document);
    const appointmentsRepository = dataSource.getRepository(Appointment);
    const referralsRepository = dataSource.getRepository(Referral);

    const ADMIN_USER = generateFakeUser({
      password,
      role: 'admin',
      status: 'active',
    });
    await usersRepository.save(ADMIN_USER);

    // Members

    console.log('👤 Creating members...');
    for (const role of USER_ROLES) {
      const user = generateFakeUser({
        email: `${role}@abnmo.org`,
        password,
        role,
        status: 'active',
      });
      await usersRepository.save(user);
    }

    // Specialists

    console.log('👤 Creating specialists...');
    const totalOfSpecialists = 8;
    for (let i = 0; i < totalOfSpecialists; i++) {
      const user = generateFakeUser({
        password,
        role: 'specialist',
        status: 'active',
      });
      await usersRepository.save(user);
    }
    console.log(`✅ ${totalOfSpecialists} specialists created.`);

    // Surveys (each with a patient + submission)

    console.log('📋 Creating surveys...');
    const totalOfSurveys = 120;
    for (let i = 0; i < totalOfSurveys; i++) {
      const isCompleted = i >= 5;
      const surveyStatus = isCompleted ? 'completed' : 'pending_signature';

      const user = generateFakeUser({
        password,
        role: 'patient',
        status: isCompleted ? 'active' : 'pending',
      });
      await usersRepository.save(user);

      const submission = generateFakeSurveySubmission({
        patient: { id: user.id },
        status: isCompleted ? 'completed' : 'approved',
        updatedBy: ADMIN_USER.id,
      });
      await surveySubmissionRepository.save(submission);

      const document = generateFakeDocument({
        user: { id: user.id },
        submission: { id: submission.id },
      });
      await documentRepository.save(document);

      const survey = generateFakeSurvey({
        patient: { id: user.id },
        status: surveyStatus,
      });
      await surveyRepository.save(survey);
    }
    console.log(`✅ ${totalOfSurveys} surveys created.`);

    // Survey submissions only (patients without surveys)

    console.log('📝 Creating survey submissions...');
    const totalOfSubmissions = 40;
    const submissionStatuses = [
      'pending_document',
      'pending_review',
      'declined',
    ] as const;
    for (let i = 0; i < totalOfSubmissions; i++) {
      const user = generateFakeUser({
        password,
        role: 'patient',
        status: 'pending',
      });
      await usersRepository.save(user);

      const submission = generateFakeSurveySubmission({
        patient: { id: user.id },
        status: faker.helpers.arrayElement(submissionStatuses),
      });
      await surveySubmissionRepository.save(submission);

      if (submission.status !== 'pending_document') {
        const document = generateFakeDocument({
          user: { id: user.id },
          submission: { id: submission.id },
        });
        await documentRepository.save(document);
      }
    }
    console.log(`✅ ${totalOfSubmissions} survey submissions created.`);

    // Appointments

    console.log('📅 Creating appointments...');
    const allPatients = await usersRepository.find({
      where: { role: 'patient' },
      select: { id: true },
    });
    const allSpecialists = await usersRepository.find({
      where: { role: 'specialist' },
      select: { id: true },
    });

    const totalOfAppointments = 155;
    const generatedAppointments: Appointment[] = [];
    for (let i = 0; i < totalOfAppointments; i++) {
      const patientId = faker.helpers.arrayElement(allPatients).id;
      const specialistId = faker.datatype.boolean()
        ? faker.helpers.arrayElement(allSpecialists).id
        : undefined;

      generatedAppointments.push(
        generateFakeAppointment({
          patient: { id: patientId },
          specialist: specialistId ? { id: specialistId } : null,
          createdBy: faker.helpers.arrayElement([
            ADMIN_USER.id,
            ...allSpecialists.map((s) => s.id),
          ]),
        }),
      );
    }
    await appointmentsRepository.save(generatedAppointments);
    console.log(`✅ ${totalOfAppointments} appointments created.`);

    // Referrals

    console.log('🔗 Creating referrals...');
    const totalOfReferrals = 98;
    const generatedReferrals: Referral[] = [];
    for (let i = 0; i < totalOfReferrals; i++) {
      const patientId = faker.helpers.arrayElement(allPatients).id;
      const specialistId = faker.datatype.boolean()
        ? faker.helpers.arrayElement(allSpecialists).id
        : undefined;

      generatedReferrals.push(
        generateFakeReferral({
          patient: { id: patientId },
          specialist: specialistId ? { id: specialistId } : null,
          createdBy: faker.helpers.arrayElement([
            ADMIN_USER.id,
            ...allSpecialists.map((s) => s.id),
          ]),
        }),
      );
    }
    await referralsRepository.save(generatedReferrals);
    console.log(`✅ ${totalOfReferrals} referrals created.`);

    console.log('🎉 Seed completed.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error executing seed:', err);
    process.exit(1);
  }
}

void main();
