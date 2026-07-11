import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import { mock, MockProxy } from 'jest-mock-extended';
import { DataSource, Repository } from 'typeorm';

import { CreateSurveyUseCase } from '@/app/http/surveys/use-cases/create-survey.use-case';
import { RequestSignatureUseCase } from '@/app/signature/use-cases/request-signature.use-case';
import { LogService } from '@/common/log/log.service';
import { Survey } from '@/domain/entities/survey';
import { SurveySubmission } from '@/domain/entities/survey-submission';
import { User } from '@/domain/entities/user';
import { EnvService } from '@/env/env.service';

const makeTxRepo = () => {
  const repo = mock<Repository<any>>();
  repo.create.mockImplementation((data: any) => ({ ...data }));
  repo.save.mockImplementation((data: any) => Promise.resolve(data));
  return repo;
};

describe('CreateSurveyUseCase', () => {
  let useCase: CreateSurveyUseCase;
  let dataSource: MockProxy<DataSource>;
  let usersRepo: MockProxy<Repository<User>>;
  let submissionsRepo: MockProxy<Repository<SurveySubmission>>;
  let surveysRepo: MockProxy<Repository<Survey>>;
  let requestSignatureUseCase: MockProxy<RequestSignatureUseCase>;
  let envService: MockProxy<EnvService>;
  let logger: MockProxy<LogService>;

  beforeEach(async () => {
    dataSource = mock<DataSource>();
    usersRepo = mock<Repository<User>>();
    submissionsRepo = mock<Repository<SurveySubmission>>();
    surveysRepo = mock<Repository<Survey>>();
    requestSignatureUseCase = mock<RequestSignatureUseCase>();
    envService = mock<EnvService>();
    logger = mock<LogService>();

    envService.get.mockReturnValue('model-key');

    dataSource.transaction.mockImplementation(async (cb: any) => {
      const txUsersRepo = makeTxRepo();
      const txSurveysRepo = makeTxRepo();
      const txSubmissionsRepo = makeTxRepo();
      const manager = mock<any>();
      manager.getRepository.mockImplementation((entity: any) => {
        if (entity === User) return txUsersRepo;
        if (entity === Survey) return txSurveysRepo;
        if (entity === SurveySubmission) return txSubmissionsRepo;
        return makeTxRepo();
      });
      return cb(manager);
    });

    const module = await Test.createTestingModule({
      providers: [
        CreateSurveyUseCase,
        { provide: getDataSourceToken(), useValue: dataSource },
        { provide: getRepositoryToken(User), useValue: usersRepo },
        {
          provide: getRepositoryToken(SurveySubmission),
          useValue: submissionsRepo,
        },
        { provide: getRepositoryToken(Survey), useValue: surveysRepo },
        { provide: RequestSignatureUseCase, useValue: requestSignatureUseCase },
        { provide: EnvService, useValue: envService },
        { provide: LogService, useValue: logger },
      ],
    }).compile();

    useCase = module.get(CreateSurveyUseCase);
  });

  const createInput = () => ({
    token: 'sub-1',
    aboutYou: {
      dateOfBirth: '1990-06-15',
      gender: 'female_cis' as const,
      race: null,
      maritalStatus: 'married' as const,
      addressCep: '12345678',
      addressState: 'SP' as const,
      addressCity: 'São Paulo',
      addressStreet: 'Rua A',
      addressNumber: '100',
      addressNeighborhood: null,
      hasLivedElsewhere: false,
      livedElsewhereDescription: null,
      cpf: '12345678901',
      susId: null,
    },
    family: {
      numberOfChildren: 0,
      childrenAges: null,
      childrenSchoolSupportSituation: null,
      familyIncome: 'up_to_1_salary' as const,
      housingSituation: 'own' as const,
      householdSize: 1,
      houseRooms: 2,
      houseBathrooms: 1,
      homeAccessLevel: 'level' as const,
      transportModes: ['car'] as string[],
    },
    journey: {
      educationLevel: 'graduation' as const,
      employmentStatus: 'employed' as const,
      studyInterruption: null,
      profession: null,
      jobTitle: null,
      salaryRange: 'up_to_2_salaries' as const,
      dismissedAfterDiagnosis: null,
      changedProfession: null,
      changedProfessionTo: null,
      currentJobIsPcd: null,
      receivesSicknessBenefit: 'none' as const,
      receivesBpcLoas: 'none' as const,
    },
    diagnosis: {
      diagnosis: 'nmo_sd' as const,
      firstCrisisSymptoms: ['visual_loss'] as string[],
      affectedAreas: ['optic_nerve'] as string[],
      diagnosingDoctorName: null,
      diagnosisHospitalName: null,
      diagnosisHospitalCep: null,
      diagnosisHospitalState: null,
      diagnosisHospitalCity: null,
      diagnosisHospitalStreet: null,
      diagnosisDate: new Date('2020-01-01'),
      diagnosisDocument: null,
      currentNeurologist: null,
      currentTreatmentHospital: null,
      currentTreatmentHospitalCep: null,
      specialistsBeforeDiagnosis: [] as string[],
      timeToDiagnosis: 3,
      timeToDiagnosisUnit: 'months' as const,
      suspectedMultipleSclerosis: null,
      otherSuspectedDiseases: null,
      crisesBeforeDiagnosis: null,
      crisesSinceDiagnosis: null,
      treatmentInHomeCity: 'yes' as const,
      hasNeurologistsInCity: null,
      crisisAction: 'emergency_room' as const,
    },
    followUp: {
      followUpSpecialties: ['neurology'] as string[],
      otherFollowUpProfessionals: [] as string[],
      followUpHow: 'sus' as const,
      hasHealthInsurance: false,
      nmoMedications: [] as string[],
      crisesAfterMedication: null,
      legalActionForMedication: 'none' as const,
      generalMedications: [] as string[],
      hasVisualAlteration: false,
      usesVisualCane: null,
      visualImpairmentAssistance: null,
      visualAssistiveTechnologies: [] as string[],
      usesWheelchair: false,
      hasMotorSequelae: false,
      motorImpairmentAssistance: null,
      walkingDistance: null,
      usesWalkingAid: false,
      bladderControl: 'normal' as const,
      bowelFunction: 'normal' as const,
      otherSequelae: null,
      psychologicalMedsBeforeNmo: false,
      psychologicalMedsAfterNmo: false,
      psychologicalDiagnosisAfterNmo: false,
      bloodType: null,
      hasOtherDisease: false,
      otherDiseaseDescription: null,
    },
    dailyLife: {
      familySupport: 'yes' as const,
      fatigue: 'moderate' as const,
      physicalActivity: 'never' as const,
      physicalActivityType: null,
      exercisedBeforeNmo: false,
      exercisesBeforeNmo: null,
      informationSources: ['doctor'] as string[],
      lifePerception: 'Life is okay',
      dreams: 'Travel more',
      additionalInfo: 'None',
    },
    supportContacts: [{ name: 'Bob', phone: '11988888888', kinship: 'spouse' }],
  });

  it('creates survey successfully', async () => {
    submissionsRepo.findOne.mockResolvedValue({
      id: 'sub-1',
      status: 'pending_review',
      user: {
        id: 'user-1',
        name: 'Alice',
        email: 'alice@example.com',
        phone: '11999999999',
        cpf: null,
      },
    } as unknown as SurveySubmission);
    usersRepo.findOne.mockResolvedValue(null);
    requestSignatureUseCase.execute.mockResolvedValue({ signatureId: 'sig-1' });
    surveysRepo.update.mockResolvedValue(undefined as any);

    await useCase.execute(createInput() as any);

    expect(submissionsRepo.findOne).toHaveBeenCalledWith({
      where: { id: 'sub-1' },
      relations: { user: true },
    });
    expect(requestSignatureUseCase.execute).toHaveBeenCalled();
  });

  it('throws NotFoundException for unknown submission', async () => {
    submissionsRepo.findOne.mockResolvedValue(null);

    await expect(useCase.execute(createInput() as any)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('throws BadRequestException for non-pending_review status', async () => {
    submissionsRepo.findOne.mockResolvedValue({
      id: 'sub-1',
      status: 'approved',
      user: {
        id: 'user-1',
        name: 'Alice',
        email: 'alice@example.com',
        phone: '11999999999',
        cpf: null,
      },
    } as unknown as SurveySubmission);

    await expect(useCase.execute(createInput() as any)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('throws ConflictException for duplicate CPF', async () => {
    submissionsRepo.findOne.mockResolvedValue({
      id: 'sub-1',
      status: 'pending_review',
      user: {
        id: 'user-1',
        name: 'Alice',
        email: 'alice@example.com',
        phone: '11999999999',
        cpf: '12345678901',
      },
    } as unknown as SurveySubmission);
    usersRepo.findOne.mockResolvedValue({
      id: 'existing-user',
      cpf: '12345678901',
    } as User);

    await expect(useCase.execute(createInput() as any)).rejects.toThrow(
      ConflictException,
    );
  });
});
