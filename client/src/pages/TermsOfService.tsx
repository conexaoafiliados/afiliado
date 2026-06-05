import { APP_NAME } from "@/const";
import { LegalLayout } from "@/components/LegalLayout";

export default function TermsOfService() {
  return (
    <LegalLayout title="Termos de Serviço" updatedAt="4 de junho de 2026">
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">1. Aceitação</h2>
        <p>
          Ao acessar ou usar o {APP_NAME} (“Plataforma”), você concorda com estes Termos de Serviço. Se
          não concordar, não utilize o serviço.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">2. O que é a Plataforma</h2>
        <p>
          O {APP_NAME} é uma plataforma digital para creators iniciantes, oferecendo ferramentas de
          crescimento (meta de seguidores no TikTok), missões gamificadas, cursos, loja, comunidade e
          analytics. O serviço é oferecido em modo beta e pode ser alterado sem aviso prévio.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">3. Conta e elegibilidade</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Você deve ter pelo menos 13 anos para criar uma conta.</li>
          <li>É responsável por manter usuário e senha em sigilo.</li>
          <li>As informações fornecidas no cadastro devem ser verdadeiras e atualizadas.</li>
          <li>Uma conta por pessoa; uso comercial depende das regras da loja e pagamentos.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">4. Integração com TikTok</h2>
        <p>
          Ao conectar sua conta TikTok, você autoriza a Plataforma a acessar, com sua permissão, dados
          permitidos pela API oficial do TikTok (como nome de exibição, @usuário e contagem de
          seguidores), exclusivamente para exibir progresso em direção à meta de 2.000 seguidores e
          histórico de evolução.
        </p>
        <p>
          Você pode desconectar o TikTok a qualquer momento em Progresso 2K. O uso da API do TikTok
          também está sujeito aos{" "}
          <a
            href="https://www.tiktok.com/legal/terms-of-service"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            Termos do TikTok
          </a>
          .
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">5. Uso permitido</h2>
        <p>Você concorda em não:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>violar leis ou direitos de terceiros;</li>
          <li>publicar conteúdo ilegal, ofensivo ou enganoso na comunidade ou loja;</li>
          <li>tentar acessar áreas restritas, interferir no sistema ou automatizar abusivamente;</li>
          <li>revender ou sublicenciar o acesso à Plataforma sem autorização.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">6. Loja e pagamentos</h2>
        <p>
          Vendas de produtos digitais ou físicos podem ser processadas por provedores terceiros (ex.:
          Stripe). Taxas, entregas e políticas de reembolso de cada produto são de responsabilidade do
          vendedor creator, dentro das regras da Plataforma e da legislação aplicável.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">7. Propriedade intelectual</h2>
        <p>
          A marca, layout e software do {APP_NAME} pertencem aos seus titulares. O conteúdo que você
          publica continua sendo seu; ao publicar na Plataforma, você nos concede licença limitada para
          exibir esse conteúdo dentro do serviço.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">8. Limitação de responsabilidade</h2>
        <p>
          A Plataforma é fornecida “como está”. Não garantimos crescimento de seguidores, vendas ou
          resultados específicos. Na medida permitida por lei, não nos responsabilizamos por danos
          indiretos decorrentes do uso do serviço ou de integrações de terceiros (TikTok, Stripe,
          Supabase).
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">9. Encerramento</h2>
        <p>
          Você pode encerrar sua conta a qualquer momento. Podemos suspender ou encerrar contas que
          violem estes Termos ou representem risco à Plataforma ou a outros usuários.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">10. Alterações e contato</h2>
        <p>
          Podemos atualizar estes Termos publicando a nova versão nesta página. O uso continuado após
          a publicação constitui aceitação. Dúvidas: utilize os canais de suporte indicados no site ou
          e-mail de contato do projeto.
        </p>
        <p>
          Leia também nossa{" "}
          <a href="/privacidade" className="text-accent hover:underline">
            Política de Privacidade
          </a>
          .
        </p>
      </section>
    </LegalLayout>
  );
}
