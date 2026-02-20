# Permissões de acesso ao sistema

Este documento detalha as permissões de acesso dos usuários do sistema, organizadas por perfil e por tipo de ação, incluindo eventuais restrições aplicáveis.

---

## Perfis de acesso

- Administração: acesso completo ao sistema e a todas as ações.
- Gestão
- Enfermagem
- Especialista
- Paciente

Legenda utilizada nas tabelas:

- Sim: ação permitida
- X: ação não permitida
- Observações adicionais são descritas quando necessário

---

## Pacientes

| Ação      | Administração | Gestão | Enfermagem | Especialista | Paciente                         |
| --------- | ------------- | ------ | ---------- | ------------ | -------------------------------- |
| Listar    | Sim           | Sim    | Sim        | Sim          | X                                |
| Detalhes  | Sim           | Sim    | Sim        | Sim          | X                                |
| Cadastrar | Sim           | Sim    | Sim        | X            | X                                |
| Alterar   | Sim           | Sim    | Sim        | X            | Sim (apenas seus próprios dados) |
| Inativar  | Sim           | Sim    | X          | X            | X                                |

---

## Atendimentos

| Ação      | Administração | Gestão | Enfermagem | Especialista | Paciente                                |
| --------- | ------------- | ------ | ---------- | ------------ | --------------------------------------- |
| Listar    | Sim           | Sim    | Sim        | Sim          | Sim (apenas seus próprios atendimentos) |
| Cadastrar | Sim           | Sim    | Sim        | Sim          | X                                       |
| Alterar   | Sim           | Sim    | Sim        | Sim          | X                                       |
| Cancelar  | Sim           | Sim    | Sim        | X            | X                                       |

---

## Encaminhamentos

| Ação      | Administração | Gestão | Enfermagem | Especialista | Paciente                                   |
| --------- | ------------- | ------ | ---------- | ------------ | ------------------------------------------ |
| Listar    | Sim           | Sim    | Sim        | Sim          | Sim (apenas seus próprios encaminhamentos) |
| Cadastrar | Sim           | Sim    | Sim        | X            | X                                          |
| Alterar   | Sim           | Sim    | Sim        | Sim          | X                                          |
| Cancelar  | Sim           | Sim    | Sim        | X            | X                                          |

---

## Contatos de apoio do paciente

| Ação      | Administração | Gestão | Enfermagem | Especialista | Paciente                            |
| --------- | ------------- | ------ | ---------- | ------------ | ----------------------------------- |
| Cadastrar | Sim           | Sim    | Sim        | X            | Sim (apenas seus próprios contatos) |
| Alterar   | Sim           | Sim    | Sim        | X            | Sim (apenas seus próprios contatos) |
| Remover   | Sim           | Sim    | Sim        | X            | Sim (apenas seus próprios contatos) |

---

## Usuários da equipe

| Ação                            | Administração | Gestão                         | Enfermagem                     | Especialista                   | Paciente |
| ------------------------------- | ------------- | ------------------------------ | ------------------------------ | ------------------------------ | -------- |
| Listar                          | Sim           | Sim                            | X                              | X                              | X        |
| Detalhes do seu próprio usuário | Sim           | Sim                            | Sim                            | Sim                            | X        |
| Alterar                         | Sim           | Sim (apenas o próprio usuário) | Sim (apenas o próprio usuário) | Sim (apenas o próprio usuário) | X        |
| Inativar                        | Sim           | X                              | X                              | X                              | X        |
| Ativar                          | Sim           | X                              | X                              | X                              | X        |
| Cadastrar convites              | Sim           | Sim                            | X                              | X                              | X        |
| Listar convites                 | Sim           | Sim                            | X                              | X                              | X        |
| Cancelar convite                | Sim           | Sim                            | X                              | X                              | X        |

---

## Estatísticas

| Ação       | Administração | Gestão | Enfermagem | Especialista | Paciente |
| ---------- | ------------- | ------ | ---------- | ------------ | -------- |
| Visualizar | Sim           | Sim    | Sim        | Sim          | X        |
