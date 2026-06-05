import { APP_NAME } from "@/const";
import { LegalLayout } from "@/components/LegalLayout";

export default function PrivacyPolicy() {
  return (
    <LegalLayout title="Política de Privacidade" updatedAt="4 de junho de 2026">
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">1. Quem somos</h2>
        <p>
          Esta Política descreve como o {APP_NAME} (“nós”, “Plataforma”) trata dados pessoais de
          usuários (“você”) ao usar nosso site e aplicativo web em{" "}
          <strong>afiliado-zeta.vercel.app</strong> e domínios relacionados.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">2. Dados que coletamos</h2>
        <h3 className="font-medium">Cadastro e conta</h3>
        <ul className="list-disc pl-6 space-y-2">
          <li>usuário, senha (armazenada de forma segura pelo provedor de autenticação);</li>
          <li>nome, idade, endereço (CEP, rua, bairro, cidade);</li>
          <li>@ TikTok e @ Instagram informados no cadastro;</li>
          <li>objetivo na plataforma e foto de perfil (opcional).</li>
        </ul>
        <h3 className="font-medium pt-2">Uso da Plataforma</h3>
        <ul className="list-disc pl-6 space-y-2">
          <li>progresso de seguidores, missões, cursos, pedidos e interações na comunidade;</li>
          <li>logs técnicos (IP, navegador, data/hora) para segurança e diagnóstico.</li>
        </ul>
        <h3 className="font-medium pt-2">Integração TikTok (opcional)</h3>
        <p>Se você conectar o TikTok, com sua autorização explícita, podemos receber da API oficial:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>identificador aberto (open_id), nome de exibição e @usuário;</li>
          <li>contagem de seguidores, seguindo e vídeos (escopo user.info.stats);</li>
          <li>tokens de acesso e atualização, armazenados de forma criptografada no servidor.</li>
        </ul>
        <p>
          Não publicamos no seu TikTok sem ação sua. Não vendemos seus dados de seguidores a
          terceiros.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">3. Finalidades</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>criar e autenticar sua conta;</li>
          <li>exibir dashboard, meta de 2K seguidores e gráfico de evolução;</li>
          <li>sincronizar seguidores do TikTok quando conectado;</li>
          <li>processar vendas na loja e exibir analytics;</li>
          <li>melhorar o serviço, prevenir fraudes e cumprir obrigações legais.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">4. Base legal (LGPD)</h2>
        <p>Tratamos dados com base em:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>execução de contrato</strong> — prestação do serviço contratado ao usar a
            Plataforma;
          </li>
          <li>
            <strong>consentimento</strong> — conexão TikTok, cookies não essenciais (quando
            aplicável);
          </li>
          <li>
            <strong>legítimo interesse</strong> — segurança, métricas agregadas e melhoria do produto.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">5. Compartilhamento com terceiros</h2>
        <p>Podemos compartilhar dados apenas com provedores necessários ao funcionamento:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Supabase</strong> — autenticação, banco de dados e armazenamento;
          </li>
          <li>
            <strong>Vercel</strong> — hospedagem da aplicação;
          </li>
          <li>
            <strong>TikTok</strong> — quando você inicia a conexão OAuth (fluxo oficial);
          </li>
          <li>
            <strong>Stripe</strong> — pagamentos na loja (quando configurado).
          </li>
        </ul>
        <p>
          Esses parceiros possuem políticas próprias. Exigimos contratos e medidas de segurança
          compatíveis com o uso contratado.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">6. Retenção e segurança</h2>
        <p>
          Mantemos os dados enquanto sua conta estiver ativa ou conforme exigido por lei. Tokens do
          TikTok são renovados conforme a API e podem ser removidos ao desconectar. Aplicamos HTTPS,
          controle de acesso e boas práticas de desenvolvimento; nenhum sistema é 100% inviolável.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">7. Seus direitos</h2>
        <p>Na LGPD, você pode solicitar:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>confirmação e acesso aos dados;</li>
          <li>correção de dados incompletos ou desatualizados;</li>
          <li>anonimização, bloqueio ou eliminação de dados desnecessários;</li>
          <li>portabilidade e revogação do consentimento (ex.: desconectar TikTok).</li>
        </ul>
        <p>
          Para exercer direitos, entre em contato pelos canais de suporte do projeto. Você também pode
          reclamar à autoridade nacional de proteção de dados (ANPD).
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">8. Menores</h2>
        <p>
          O serviço é destinado a usuários com 13 anos ou mais. Menores de 18 anos devem ter
          consentimento dos responsáveis quando exigido pela lei local.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">9. Alterações</h2>
        <p>
          Esta Política pode ser atualizada. A data no topo indica a última revisão. Alterações
          relevantes serão comunicadas na Plataforma quando apropriado.
        </p>
        <p>
          Consulte também os{" "}
          <a href="/termos" className="text-accent hover:underline">
            Termos de Serviço
          </a>
          .
        </p>
      </section>
    </LegalLayout>
  );
}
