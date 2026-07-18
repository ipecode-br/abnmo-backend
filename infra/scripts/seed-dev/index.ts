import { createHmac } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';

import { faker } from '@faker-js/faker';
import { hash } from 'bcryptjs';
import dataSource from 'infra/database/data.source';
import { appointmentFactory } from 'tests/config/factories/appointment.factory';
import { documentFactory } from 'tests/config/factories/document.factory';
import { referralFactory } from 'tests/config/factories/referral.factory';
import { datetimeFactory } from 'tests/config/factories/shared.factory';
import { surveyFactory } from 'tests/config/factories/survey.factory';
import { surveySubmissionFactory } from 'tests/config/factories/survey-submission.factory';
import { userFactory } from 'tests/config/factories/user.factory';

import { Appointment } from '@/domain/entities/appointment';
import { Document } from '@/domain/entities/document';
import { Referral } from '@/domain/entities/referral';
import { Survey } from '@/domain/entities/survey';
import { SurveySubmission } from '@/domain/entities/survey-submission';
import { User } from '@/domain/entities/user';
import { USER_ROLES } from '@/domain/enums/users';

const DATABASE_DEV_NAME = 'abnmo_dev';

function loadCitiesByState(): Record<string, string[]> {
  const citiesByState: Record<string, string[]> = {};
  const statesWithCities = [
    'AL',
    'BA',
    'CE',
    'MG',
    'PA',
    'PE',
    'RS',
    'SP',
  ] as const;

  for (const state of statesWithCities) {
    const filePath = path.join(__dirname, 'utils', 'cities', `${state}.json`);
    const data = fs.readFileSync(filePath, 'utf-8');
    citiesByState[state] = JSON.parse(data) as string[];
  }

  return citiesByState;
}

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

    const citiesByState = loadCitiesByState();

    const ADMIN_USER = usersRepository.create(
      userFactory({
        password,
        role: 'admin',
        status: 'active',
      }),
    );
    await usersRepository.save(ADMIN_USER);

    console.log('👤 Creating members...');
    for (const role of USER_ROLES) {
      const user = usersRepository.create(
        userFactory({
          email: `${role}@abnmo.org`,
          password,
          role,
          status: 'active',
          createdAt: datetimeFactory(),
        }),
      );
      await usersRepository.save(user);
    }

    console.log('👤 Creating specialists...');
    const totalOfSpecialists = 8;
    for (let i = 0; i < totalOfSpecialists; i++) {
      const user = usersRepository.create(
        userFactory({
          password,
          role: 'specialist',
          status: 'active',
        }),
      );
      await usersRepository.save(user);
    }
    console.log(`✅ ${totalOfSpecialists} specialists created.`);

    console.log('📋 Creating surveys...');
    const totalOfSurveys = 120;
    for (let i = 0; i < totalOfSurveys; i++) {
      const isCompleted = i >= 5;
      const surveyStatus = isCompleted ? 'completed' : 'pending_signature';

      const patient = usersRepository.create(
        userFactory({
          password,
          role: 'patient',
          status: isCompleted ? 'active' : 'pending',
          createdAt: datetimeFactory(),
        }),
      );
      await usersRepository.save(patient);

      const submission = surveySubmissionRepository.create(
        surveySubmissionFactory({
          patient,
          status: isCompleted ? 'completed' : 'approved',
          updatedBy: ADMIN_USER.id,
          createdAt: datetimeFactory(),
        }),
      );
      await surveySubmissionRepository.save(submission);

      const document = documentRepository.create(
        documentFactory({
          user: patient,
          status: 'confirmed',
          submission,
        }),
      );
      await documentRepository.save(document);

      const survey = surveyRepository.create(
        surveyFactory(
          { patient, status: surveyStatus, createdAt: datetimeFactory() },
          { citiesByState },
        ),
      );
      await surveyRepository.save(survey);
    }
    console.log(`✅ ${totalOfSurveys} surveys created.`);

    console.log('📝 Creating survey submissions...');
    const totalOfSubmissions = 40;
    const submissionStatuses = [
      'pending_document',
      'pending_review',
      'declined',
    ] as const;
    for (let i = 0; i < totalOfSubmissions; i++) {
      const patient = usersRepository.create(
        userFactory({
          password,
          role: 'patient',
          status: 'pending',
          createdAt: datetimeFactory(),
        }),
      );
      await usersRepository.save(patient);

      const submission = surveySubmissionRepository.create(
        surveySubmissionFactory({
          patient,
          status: faker.helpers.arrayElement(submissionStatuses),
          createdAt: datetimeFactory(),
        }),
      );
      await surveySubmissionRepository.save(submission);

      if (submission.status !== 'pending_document') {
        const document = documentRepository.create(
          documentFactory({
            user: patient,
            status: 'confirmed',
            submission,
          }),
        );
        await documentRepository.save(document);
      }
    }
    console.log(`✅ ${totalOfSubmissions} survey submissions created.`);

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
    const appointments: Appointment[] = [];
    for (let i = 0; i < totalOfAppointments; i++) {
      const patientId = faker.helpers.arrayElement(allPatients).id;
      const specialistId = faker.datatype.boolean()
        ? faker.helpers.arrayElement(allSpecialists).id
        : undefined;

      appointments.push(
        appointmentsRepository.create(
          appointmentFactory({
            patient: { id: patientId } as User,
            specialist: specialistId ? ({ id: specialistId } as User) : null,
            createdBy: faker.helpers.arrayElement([
              ADMIN_USER.id,
              ...allSpecialists.map((s) => s.id),
            ]),
            createdAt: datetimeFactory(),
          }),
        ),
      );
    }
    await appointmentsRepository.save(appointments);
    console.log(`✅ ${totalOfAppointments} appointments created.`);

    console.log('🔗 Creating referrals...');
    const totalOfReferrals = 98;
    const referrals: Referral[] = [];
    for (let i = 0; i < totalOfReferrals; i++) {
      const patientId = faker.helpers.arrayElement(allPatients).id;
      const specialistId = faker.datatype.boolean()
        ? faker.helpers.arrayElement(allSpecialists).id
        : undefined;

      referrals.push(
        referralsRepository.create(
          referralFactory({
            patient: { id: patientId } as User,
            specialist: specialistId ? ({ id: specialistId } as User) : null,
            createdBy: faker.helpers.arrayElement([
              ADMIN_USER.id,
              ...allSpecialists.map((s) => s.id),
            ]),
            createdAt: datetimeFactory(),
          }),
        ),
      );
    }
    await referralsRepository.save(referrals);
    console.log(`✅ ${totalOfReferrals} referrals created.`);

    console.log('🎉 Seed completed.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error executing seed:', err);
    process.exit(1);
  }
}

void main();
