You are working inside an existing production NestJS backend.

Your task is to implement a robust, scalable, reusable notification system.

Before implementing:

1. Analyze the entire repository structure.
2. Identify:
   - UseCase architecture pattern
   - Repository pattern
   - Zod schema usage (entities, request schemas, response schemas)
   - DTO pattern (DTOs are used ONLY at controller level)
   - Role guard implementation
   - Migration pattern
   - Naming conventions
3. Follow EXACTLY the same patterns and conventions.
4. Do NOT introduce a new architectural style.
5. Do NOT refactor unrelated files.

This is a strict senior-level implementation.
Performance, scalability, and clean architecture matter.

--------------------------------------------------
ARCHITECTURE RULES (VERY IMPORTANT)
--------------------------------------------------

- Business logic must live in UseCases.
- Controllers must be thin.
- DTOs are used ONLY in controllers.
- UseCases must NOT depend on DTOs.
- UseCases must use specifically typed properties (explicit interfaces/types).
- Zod schemas define:
  - entity shapes
  - request validation
  - response shapes
- DTOs are derived from Zod schemas.
- Database naming pattern is snake_case.
- Follow existing transaction and repository patterns.
- Use dependency injection (never instantiate UseCases manually).

--------------------------------------------------
FEATURE REQUIREMENTS
--------------------------------------------------

We need a database-driven notification system (NOT real-time).

All authenticated roles can READ notifications.
Only ADMIN and MANAGER roles can CREATE notifications.

The system has:
- users table
- patients table

Notifications must support BOTH users and patients.

That means notifications must not be tied only to users.

Design a generalized solution.

--------------------------------------------------
DATABASE DESIGN (SENIOR-LEVEL)
--------------------------------------------------

Use snake_case.

Create two tables:

1) notifications

- id (primary key)
- title (varchar)
- content (text)
- type (enum: info | success | warning | error) nullable
- created_by (FK -> users.id)
- created_at
- updated_at (if project pattern uses it)

2) notification_recipients

This replaces "user_notifications".

- id (primary key)
- notification_id (FK -> notifications.id)
- recipient_type (enum: 'user' | 'patient')
- recipient_id (uuid)
- is_read (boolean default false)
- read_at (nullable datetime)
- created_at

Indexes (MANDATORY):

- index on recipient_type + recipient_id
- composite index on (recipient_type, recipient_id, is_read)
- index on notification_id

This ensures:
- Fast unread count
- Fast pagination
- Scales to 100k+ recipients

Use proper foreign keys where applicable.

--------------------------------------------------
SCALABILITY REQUIREMENTS
--------------------------------------------------

- Bulk insert recipients (no N+1 inserts).
- If sending to ALL users or ALL patients:
  - Use batch processing.
  - Avoid loading full entities into memory.
  - Select only IDs.
- Avoid N+1 queries in read endpoints.
- Use joins properly for listing notifications.
- Ensure queries are index-friendly.

--------------------------------------------------
ZOD SCHEMAS
--------------------------------------------------

Create Zod schemas for:

- NotificationSchema
- NotificationRecipientSchema
- CreateNotificationRequestSchema
- GetNotificationsResponseSchema
- GetUnreadNotificationsCountResponseSchema

Follow existing schema naming and structure conventions.

DTOs must be created in controller layer only,
derived from Zod schemas,
and used for request validation and response typing.

--------------------------------------------------
USE CASES TO IMPLEMENT
--------------------------------------------------

1) CreateNotificationUseCase

This must be reusable and injectable.

It must accept strictly typed input:

interface CreateNotificationInput {
  title: string
  content: string
  type?: 'info' | 'success' | 'warning' | 'error'
  createdByUserId: string

  sendToAllUsers?: boolean
  sendToAllPatients?: boolean

  targetUsersIds?: string[]
  targetPatientsIds?: string[]
}

Rules:

- At least one target must be defined.
- If sendToAllUsers = true:
    fetch only user IDs (no full entities).
- If sendToAllPatients = true:
    fetch only patient IDs.
- If specific targets are provided:
    use them directly.
- Insert recipients in bulk.
- Use transaction if required by project pattern.
- Return a typed result (not DTO).

IMPORTANT:
Other UseCases must be able to inject and call this one.
For example:
CreatePatientRequirementUseCase should call CreateNotificationUseCase after success.

Never couple this to HTTP layer.

--------------------------------------------------

2) GetNotificationsUseCase

Input:
interface GetNotificationsInput {
  recipientType: 'user' | 'patient'
  recipientId: string
  page: number
  limit: number
}

Behavior:
- Paginated
- Ordered by notifications.created_at DESC
- Join notifications + notification_recipients
- Return:
  - id
  - title
  - content
  - type
  - is_read
  - read_at
  - created_at

Avoid N+1 queries.

--------------------------------------------------

3) GetUnreadNotificationsCountUseCase

Input:
interface GetUnreadCountInput {
  recipientType: 'user' | 'patient'
  recipientId: string
}

Must return fast count query using composite index.

--------------------------------------------------

4) MarkNotificationAsReadUseCase

Input:
interface MarkNotificationAsReadInput {
  recipientType: 'user' | 'patient'
  recipientId: string
  notificationId: string
}

Must:
- Verify ownership
- Update only if not already read
- Set read_at
- Not fail if already read

--------------------------------------------------

5) MarkAllNotificationsAsReadUseCase

Efficient single query update.

--------------------------------------------------
CONTROLLER
--------------------------------------------------

Name it:

NotificationsController

Routes:

GET /notifications
GET /notifications/unread-count
PATCH /notifications/:id/read
PATCH /notifications/read-all
POST /notifications

Authorization:

- POST → ADMIN and MANAGER only
- Others → any authenticated user or patient (follow existing auth pattern)

Use existing guards and role decorators.

DTOs must be used only in controller layer.

--------------------------------------------------
INTEGRATION REQUIREMENT
--------------------------------------------------

CreateNotificationUseCase must be injectable.

Other UseCases must be able to do:

constructor(
  private readonly createNotificationUseCase: CreateNotificationUseCase
)

Then call:

await this.createNotificationUseCase.execute(...)

Do not manually instantiate.

--------------------------------------------------
QUALITY CONSTRAINTS
--------------------------------------------------

- Follow SOLID principles.
- No duplicated logic.
- No business logic in controllers.
- Respect existing folder structure.
- Use existing error classes.
- Use existing pagination utilities if available.
- Respect snake_case DB naming.
- Respect existing migration format.
- Ensure high performance queries.
- Do not break existing code.
- Do not change unrelated modules.

--------------------------------------------------
EXPECTED OUTPUT
--------------------------------------------------

Generate:

- Entities
- Zod schemas
- All UseCases
- NotificationsController
- Module wiring
- Proper DI configuration
- Role integration

Implementation must be production-ready and scalable.
