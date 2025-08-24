import { Octokit } from '@octokit/rest';
import axios, { AxiosResponse } from 'axios';

interface SonarMeasure {
  metric: string;
  value: string;
}

interface SonarComponent {
  measures: SonarMeasure[];
}

interface SonarMeasureResponse {
  component: SonarComponent;
}

interface SonarIssue {
  key: string;
  rule: string;
  severity: string;
  component: string;
  line?: number;
  message: string;
  type: 'BUG' | 'VULNERABILITY' | 'CODE_SMELL';
}

interface SonarIssueResponse {
  issues: SonarIssue[];
}

interface FormattedMetrics {
  bugs: number;
  vulnerabilities: number;
  codeSmells: number;
  coverage: string;
  duplicatedLines: string;
  reliabilityRating: string;
  securityRating: string;
  maintainabilityRating: string;
}

interface IssuesByType {
  BUG: SonarIssue[];
  VULNERABILITY: SonarIssue[];
  CODE_SMELL: SonarIssue[];
}

class SonarPRBot {
  private octokit: Octokit;
  private sonarUrl: string;
  private sonarToken: string;
  private projectKey: string;

  constructor() {
    this.octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });
    this.sonarUrl = process.env.SONAR_HOST_URL!;
    this.sonarToken = process.env.SONAR_TOKEN!;
    this.projectKey = process.env.SONAR_PROJECT_KEY || 'abnmo-backend';
  }

  async getSonarQubeResults(
    prKey: string,
  ): Promise<SonarMeasureResponse | null> {
    try {
      const response: AxiosResponse<SonarMeasureResponse> = await axios.get(
        `${this.sonarUrl}/api/measures/component`,
        {
          params: {
            component: this.projectKey,
            pullRequest: prKey,
            metricKeys:
              'bugs,vulnerabilities,code_smells,coverage,duplicated_lines_density,reliability_rating,security_rating,sqale_rating',
          },
          headers: {
            Authorization: `Bearer ${this.sonarToken}`,
          },
        },
      );
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar dados do SonarQube:', error);
      return null;
    }
  }

  async getSonarQubeIssues(prKey: string): Promise<SonarIssue[]> {
    try {
      const response: AxiosResponse<SonarIssueResponse> = await axios.get(
        `${this.sonarUrl}/api/issues/search`,
        {
          params: {
            componentKeys: this.projectKey,
            pullRequest: prKey,
            statuses: 'OPEN',
            ps: 500,
          },
          headers: {
            Authorization: `Bearer ${this.sonarToken}`,
          },
        },
      );
      return response.data.issues;
    } catch (error) {
      console.error('Erro ao buscar issues do SonarQube:', error);
      return [];
    }
  }

  private formatMetrics(measures: SonarMeasure[]): FormattedMetrics {
    const metrics: Record<string, string> = {};
    measures.forEach((measure) => {
      metrics[measure.metric] = measure.value;
    });

    return {
      bugs: parseInt(metrics.bugs || '0'),
      vulnerabilities: parseInt(metrics.vulnerabilities || '0'),
      codeSmells: parseInt(metrics.code_smells || '0'),
      coverage: parseFloat(metrics.coverage || '0').toFixed(1),
      duplicatedLines: parseFloat(
        metrics.duplicated_lines_density || '0',
      ).toFixed(1),
      reliabilityRating: this.getRatingLabel(metrics.reliability_rating),
      securityRating: this.getRatingLabel(metrics.security_rating),
      maintainabilityRating: this.getRatingLabel(metrics.sqale_rating),
    };
  }

  private getRatingLabel(rating: string): string {
    const ratings: Record<string, string> = {
      '1.0': '🟢 A',
      '2.0': '🟡 B',
      '3.0': '🟠 C',
      '4.0': '🔴 D',
      '5.0': '🔴 E',
    };
    return ratings[rating] || '⚫ N/A';
  }

  private formatIssues(issues: SonarIssue[]): IssuesByType {
    const issuesByType: IssuesByType = {
      BUG: [],
      VULNERABILITY: [],
      CODE_SMELL: [],
    };

    issues.forEach((issue) => {
      if (issuesByType[issue.type]) {
        issuesByType[issue.type].push(issue);
      }
    });

    return issuesByType;
  }

  private generateCommentBody(
    metrics: FormattedMetrics,
    issues: SonarIssue[],
  ): string {
    const issuesByType = this.formatIssues(issues);

    let comment = `## 🔍 Análise SonarQube - Review Automatizado

### 📊 Métricas Gerais
| Métrica | Valor |
|---------|-------|
| 🐛 Bugs | ${metrics.bugs} |
| 🔒 Vulnerabilidades | ${metrics.vulnerabilities} |
| 💨 Code Smells | ${metrics.codeSmells} |
| 📈 Cobertura | ${metrics.coverage}% |
| 📋 Linhas Duplicadas | ${metrics.duplicatedLines}% |

### 🏆 Ratings de Qualidade
| Tipo | Rating |
|------|--------|
| 🔧 Confiabilidade | ${metrics.reliabilityRating} |
| 🛡️ Segurança | ${metrics.securityRating} |
| 🧹 Manutenibilidade | ${metrics.maintainabilityRating} |

`;

    // Adiciona detalhes dos issues mais críticos
    if (issuesByType.VULNERABILITY.length > 0) {
      comment += `### 🚨 Vulnerabilidades Encontradas (${issuesByType.VULNERABILITY.length})\n`;
      issuesByType.VULNERABILITY.slice(0, 5).forEach((issue) => {
        comment += `- **${issue.severity}**: ${issue.message} (${issue.component}:${issue.line ?? 'N/A'})\n`;
      });
      comment += '\n';
    }

    if (issuesByType.BUG.length > 0) {
      comment += `### 🐛 Bugs Encontrados (${issuesByType.BUG.length})\n`;
      issuesByType.BUG.slice(0, 5).forEach((issue) => {
        comment += `- **${issue.severity}**: ${issue.message} (${issue.component}:${issue.line ?? 'N/A'})\n`;
      });
      comment += '\n';
    }

    if (issuesByType.CODE_SMELL.length > 5) {
      comment += `### 💨 Code Smells Principais (${issuesByType.CODE_SMELL.length} total)\n`;
      issuesByType.CODE_SMELL.filter(
        (issue) => issue.severity === 'MAJOR' || issue.severity === 'CRITICAL',
      )
        .slice(0, 5)
        .forEach((issue) => {
          comment += `- **${issue.severity}**: ${issue.message} (${issue.component}:${issue.line ?? 'N/A'})\n`;
        });
      comment += '\n';
    }

    // Adiciona recomendações
    comment += this.generateRecommendations(metrics);

    comment += `
---
*🤖 Este comentário foi gerado automaticamente pelo bot de review da ABNMO*
`;

    return comment;
  }

  private generateRecommendations(metrics: FormattedMetrics): string {
    let recommendations = `### 💡 Recomendações\n\n`;

    const coverageNum = parseFloat(metrics.coverage);
    const duplicatedLinesNum = parseFloat(metrics.duplicatedLines);

    if (coverageNum < 80) {
      recommendations += `- 📈 **Cobertura baixa (${metrics.coverage}%)**: Adicione mais testes unitários para atingir pelo menos 80% de cobertura\n`;
    }

    if (metrics.bugs > 0) {
      recommendations += `- 🐛 **${metrics.bugs} bugs encontrados**: Corrija os bugs antes do merge para manter a qualidade do código\n`;
    }

    if (metrics.vulnerabilities > 0) {
      recommendations += `- 🚨 **${metrics.vulnerabilities} vulnerabilidades**: URGENTE - Corrija as vulnerabilidades de segurança antes do merge\n`;
    }

    if (duplicatedLinesNum > 10) {
      recommendations += `- 📋 **Duplicação alta (${metrics.duplicatedLines}%)**: Refatore código duplicado para melhorar a manutenibilidade\n`;
    }

    if (metrics.codeSmells > 10) {
      recommendations += `- 💨 **Muitos code smells (${metrics.codeSmells})**: Refatore o código seguindo as boas práticas do NestJS\n`;
    }

    return recommendations;
  }

  async commentOnPR(
    owner: string,
    repo: string,
    prNumber: number,
    comment: string,
  ): Promise<void> {
    try {
      // Verifica se já existe um comentário do bot
      const comments = await this.octokit.rest.issues.listComments({
        owner,
        repo,
        issue_number: prNumber,
      });

      const botComment = comments.data.find((c) =>
        c.body?.includes('🔍 Análise SonarQube - Review Automatizado'),
      );

      if (botComment) {
        // Atualiza o comentário existente
        await this.octokit.rest.issues.updateComment({
          owner,
          repo,
          comment_id: botComment.id,
          body: comment,
        });
        console.log('Comentário atualizado com sucesso');
      } else {
        // Cria um novo comentário
        await this.octokit.rest.issues.createComment({
          owner,
          repo,
          issue_number: prNumber,
          body: comment,
        });
        console.log('Comentário criado com sucesso');
      }
    } catch (error) {
      console.error('Erro ao comentar no PR:', error);
    }
  }

  async reviewPR(
    owner: string,
    repo: string,
    prNumber: number,
    prKey: string,
  ): Promise<void> {
    console.log(`Analisando PR #${prNumber} (${prKey})...`);

    const sonarData = await this.getSonarQubeResults(prKey);
    const issues = await this.getSonarQubeIssues(prKey);

    if (!sonarData) {
      console.log('Dados do SonarQube não encontrados');
      return;
    }

    const metrics = this.formatMetrics(sonarData.component.measures);
    const comment = this.generateCommentBody(metrics, issues);

    await this.commentOnPR(owner, repo, prNumber, comment);
  }
}

// Execução do bot
const main = async (): Promise<void> => {
  const bot = new SonarPRBot();

  const owner = process.env.GITHUB_REPOSITORY_OWNER || 'ipecode-br';
  const repo = process.env.GITHUB_REPOSITORY_NAME || 'abnmo-backend';
  const prNumber = process.env.GITHUB_PR_NUMBER;
  const prKey = process.env.SONAR_PR_KEY || prNumber;

  if (!prNumber || !prKey) {
    console.log('Número do PR não fornecido');
    return;
  }

  await bot.reviewPR(owner, repo, parseInt(prNumber), prKey);
};

main().catch(console.error);
