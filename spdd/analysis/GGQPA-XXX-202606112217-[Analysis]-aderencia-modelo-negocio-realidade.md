# SPDD Analysis: Aderencia do Modelo de Negocio a Realidade

## Original Business Requirement

Analise o modelo de negócio atual e avalie se ele está ancorado na realidade. Identifique suposições não validadas, especialmente sobre o problema que o produto se propõe a resolver. Questione: esse problema existe? É sentido pelos usuários-alvo? A solução é condizente com o contexto real deles? Sugira iterações que aumentem a aderência entre proposta de valor e realidade do mercado. O objetivo é evitar construir algo que resolva um problema inexistente.

## Domain Concept Identification

### Existing Concepts (from codebase)

- **Casa (Tenant)**: nucleo isolado de colaboracao financeira, que pode representar casal, familia, republica ou outro grupo. E o limite de propriedade dos dados, membros, cartoes, faturas, gastos e contas fixas.
- **Usuario e Membro da Casa**: separam identidade de acesso e participacao financeira. Um usuario pode participar de mais de uma casa, com papeis de administrador, morador ou visualizador.
- **Ledger Domestico Compartilhado**: conjunto de gastos e divisoes que registra quem pagou, quem participou e quanto cabe a cada pessoa.
- **Cartao e Fatura**: representam o contexto mensal de credito, incluindo dono do cartao, fechamento, parcelamento e consolidacao de despesas.
- **Conta Fixa**: modelo de despesa recorrente com participantes predefinidos, voltado a custos repetidos da moradia.
- **Saldo e Acerto**: calculam creditos, debitos e uma quantidade reduzida de transferencias entre membros para liquidar o periodo.
- **Rateio Proporcional a Renda**: opcao de divisao baseada na renda declarada dos participantes, alem da divisao igualitaria.
- **Privacidade de Gasto**: permite manter o valor no saldo compartilhado enquanto mascara a descricao para parte dos moradores; comprador e dono do cartao permanecem autorizados a ve-la.
- **Auditoria Financeira**: registra criacao, edicao e exclusao de gastos e alteracoes de renda para tornar mudancas relevantes rastreaveis.

### New Concepts Required

- **Segmento Inicial Validado**: grupo estreito com contexto e comportamento comuns. A recomendacao e testar primeiro casais que moram juntos, mantem contas bancarias separadas ou hibridas e reconciliam despesas recorrentes e cartoes mensalmente.
- **Job to Be Done Primario**: reduzir o trabalho e a incerteza de fechar as despesas compartilhadas do mes, sabendo quem pagou, quem deve e quais poucos acertos precisam ser feitos.
- **Alternativa Atual**: processo que o publico ja usa, como planilha, WhatsApp, anotacoes, extrato bancario ou pedido de Pix. O produto precisa ser claramente melhor que essa combinacao, e nao apenas tecnicamente mais completo.
- **Evidencia de Problema**: entrevistas, observacao do fechamento mensal, historico de erros, tempo gasto e frequencia do incômodo. Estatisticas gerais sobre brigas financeiras nao substituem essa evidencia.
- **Evento de Ativacao**: primeira casa com pelo menos duas pessoas, despesas reais suficientes para representar o mes e um acerto compreendido e aceito pelos participantes.
- **Resultado de Valor**: reducao de tempo de conciliacao, esquecimentos, divergencias e transferencias necessarias, acompanhada de repeticao voluntaria no mes seguinte.
- **Politica de Transparencia da Casa**: acordo explicito sobre quais informacoes podem ser privadas, quem pode ve-las e em quais contextos a privacidade nao se aplica.
- **Hipotese de Receita**: disposicao de uma casa ativa a pagar por valor recorrente. Nao existe assinatura, plano, limite comercial ou cobranca implementada no modelo atual.

### Key Business Rules

- **Fechamento Contabil**: toda divisao deve preservar exatamente o valor total do gasto; arredondamentos nao podem criar ou remover saldo.
- **Credito ao Pagador Real**: em compras no cartao, o credito de reembolso pertence ao responsavel financeiro correto, mesmo quando outra pessoa realizou a compra.
- **Rateio por Renda e Opcional**: proporcionalidade nao representa automaticamente justica. Ela so deve ser usada quando o grupo escolher esse criterio conscientemente.
- **Renda Ausente Nao Deve Ser Inventada**: estimar silenciosamente a renda de um membro pela media do grupo cria uma falsa precisao para um dado sensivel. Sem dados acordados, o produto deve pedir uma decisao explicita ou usar outro criterio escolhido pelo grupo.
- **Privacidade Nao Equivale a Combater Infidelidade Financeira**: ocultar a natureza de uma compra pode proteger intimidade legitima, mas tambem pode facilitar ocultacao. A funcionalidade nao deve ser apresentada como solucao universal para conflito ou deslealdade financeira.
- **Valor Depende de Aderencia Coletiva**: o saldo so e confiavel quando as despesas relevantes sao registradas. Um ledger incompleto pode piorar discussoes ao produzir uma aparencia enganosa de exatidao.
- **Auditoria Nao Substitui Consentimento**: rastrear alteracoes ajuda a investigar divergencias, mas nao resolve acordos ruins, coercao ou falta de confianca entre moradores.

## Strategic Approach

### Reality Assessment

- **Veredito**: a categoria do problema existe, mas o encaixe especifico entre problema, segmento e solucao do DIVI ainda nao esta validado. O produto esta ancorado em uma realidade plausivel, nao em evidencia suficiente para ampliar o escopo com seguranca.
- **Evidencia de categoria**: Splitwise oferece grupos, saldos, divisoes desiguais, recorrencias e simplificacao de dividas para parceiros, familias e moradores. O tricount declara atender casais e roommates e informa 21 milhoes de usuarios. Isso demonstra demanda pela categoria de despesas compartilhadas, mas nao prova preferencia pelo DIVI nem pelo recorte brasileiro proposto.
- **Evidencia do problema relacional**: pesquisa academica confirma que conflitos e ocultacao financeira existem em relacionamentos. Contudo, a mesma literatura define infidelidade financeira como comportamento financeiro deliberadamente ocultado. Portanto, usar "gasto privado" como resposta a infidelidade financeira e conceitualmente contraditorio sem regras de consentimento.
- **Evidencia interna de aderencia**: nao foram encontrados analytics de produto, eventos de ativacao, funil, retencao, pesquisa de satisfacao, feedback estruturado, coorte piloto ou dados de uso real. Os documentos SPDD anteriores citam percentuais de mercado, mas nao registram fontes verificaveis nem contato com usuarios-alvo.
- **Evidencia de receita**: ausente. O repositorio nao possui planos, assinatura, cobranca ou teste de disposicao a pagar. Atualmente ha um produto funcional em construcao, nao um modelo de negocio completo.

### Solution Direction

- Reposicionar a promessa principal de **"reduzir conflitos financeiros domesticos"** para **"fechar as despesas compartilhadas do mes com menos trabalho, menos esquecimentos e acertos claros"**. Conflito e um resultado humano amplo; reconciliacao e um trabalho observavel que o produto consegue executar.
- Concentrar a primeira validacao em casais com financas hibridas e despesas recorrentes, pois cartoes, faturas, parcelamentos, contas fixas e fechamento mensal ja formam o nucleo mais coerente do produto.
- Tratar republicas, familias extensas, viagens, emprestimos e multiplas casas como contextos secundarios ate que um deles demonstre uso e retencao proprios.
- Interromper a expansao de funcionalidades e executar uma fase de descoberta com uso real. O objetivo nao e perguntar se a ideia parece boa, mas observar como dez a quinze casas fecham um mes hoje e acompanhar uma amostra usando o DIVI por dois ciclos completos.
- Instrumentar apenas os marcos necessarios para aprender: casa criada, segundo membro ativo, primeira despesa real, primeiro fechamento, primeiro acerto e retorno no mes seguinte.
- Testar receita somente depois de repeticao de valor. A hipotese mais coerente e assinatura por casa, paga pelo organizador financeiro, mas preco e pacote devem ser validados por teste de oferta antes de construir billing.

### Key Design Decisions

- **Problema administrativo vs. problema relacional**: prometer resolver brigas amplia demais a causalidade e pode gerar expectativas que software nao controla. Recomenda-se resolver reconciliacao, memoria e clareza; a reducao de atrito deve ser medida como consequencia.
- **Casais com financas hibridas vs. publico domestico amplo**: um foco inicial reduz variacao de regras e permite linguagem, onboarding e metricas coerentes. Recomenda-se casais que dividem custos mensais sem unificar completamente as contas.
- **Rateio por renda vs. criterios acordados**: renda proporcional pode parecer justa, mas exige revelacao de dado sensivel e nao considera consumo, patrimonio, trabalho domestico ou acordos anteriores. Recomenda-se oferecer igual, percentual fixo e valores customizados; renda deve ser um atalho opcional, nunca uma regra presumida.
- **Privacidade individual vs. transparencia do grupo**: a utilidade varia por contexto. Recomenda-se uma politica escolhida pela casa, com explicacao clara de visibilidade e sem associar ocultacao a prevencao de infidelidade financeira.
- **Entrada manual vs. automacao prematura**: integracao bancaria pode reduzir friccao, mas aumenta custo, risco e complexidade antes da validacao. Recomenda-se primeiro provar que o fechamento mensal gera valor e medir onde a entrada manual causa abandono; depois testar importacao ou captura assistida no ponto de maior friccao.
- **Completude funcional vs. tempo ate valor**: o fluxo atual pede varias decisoes por lancamento. Recomenda-se otimizar repeticao de despesas conhecidas e defaults do grupo somente com base em comportamento observado, nao adicionar mais opcoes ao wizard.
- **Produto gratuito vs. assinatura por casa**: concorrentes oferecem grande parte do nucleo gratuitamente, o que reduz disposicao a pagar apenas pela matematica de divisao. A cobranca deve se apoiar em valor diferenciado comprovado, como fechamento mensal brasileiro, faturas/cartoes, automacao ou governanca; ate la, monetizacao permanece hipotese.

### Alternatives Considered

- **Continuar atendendo simultaneamente casais, familias, republicas e qualquer grupo**: rejeitado como estrategia inicial porque mascara diferencas de frequencia, confianca, regras de rateio e disposicao a pagar.
- **Definir conflito financeiro como dor primaria**: rejeitado porque o conflito existe, mas nao ha evidencia de que registrar e dividir gastos seja a intervencao que o resolve. Em alguns casos, mais visibilidade pode inclusive aumentar o conflito.
- **Usar estatisticas gerais como validacao da feature**: rejeitado. Evidencia de que pessoas discutem sobre dinheiro nao valida rateio por renda, gasto privado, auditoria ou o fluxo atual.
- **Construir Open Finance ou pagamentos agora**: rejeitado nesta fase. Essas capacidades podem reduzir entrada manual ou concluir acertos, mas nao devem anteceder a prova de uso recorrente do ledger.

### Recommended Validation Iterations

1. **Entrevista baseada em comportamento passado**: conversar separadamente com 12 organizadores financeiros e, quando possivel, seus parceiros. Pedir que mostrem o ultimo fechamento real, artefatos usados, erros, tempo gasto e discussao gerada. Nao apresentar o DIVI antes de entender o processo atual.
2. **Teste concierge de fechamento**: executar manualmente o fechamento de um mes para cinco casas usando dados reais e entregar saldo e acertos. Avancar apenas se pelo menos tres solicitarem repetir no mes seguinte sem incentivo.
3. **Piloto de dois ciclos**: acompanhar cinco a dez casas por dois meses. Criterio inicial de sinal: maioria completa o primeiro fechamento, pelo menos metade retorna para o segundo e o ledger nao depende de cobranca constante do pesquisador.
4. **Teste das regras de divisao**: comparar igual, percentual acordado e renda proporcional. Medir escolha espontanea, desconforto ao informar renda, frequencia de ajuste manual e percepcao de justica por ambos os participantes.
5. **Teste de privacidade por cenario**: apresentar casos de casal, republica e cartao de terceiro. A feature so deve permanecer no nucleo se houver acordo claro entre os participantes sobre o que fica oculto e se isso nao impedir conciliacao.
6. **Teste de friccao de registro**: observar quantos lancamentos sao esquecidos e em qual etapa o fluxo e abandonado. Priorizar templates, duplicacao, importacao ou lembretes conforme a causa observada, nao por intuicao.
7. **Teste de disposicao a pagar**: depois do segundo fechamento, oferecer um plano real, ainda que cobrado manualmente, com duas ou tres faixas. Medir pagamento efetivo; interesse verbal nao conta como validacao.
8. **Regra de descarte**: se as casas nao retornarem no segundo ciclo, mantiverem a planilha/WhatsApp como fonte oficial ou recusarem registrar despesas durante o mes, parar a expansao e revisar o problema antes de desenvolver novas features.

## Risk & Gap Analysis

### Requirement Ambiguities

- **Publico-alvo indefinido**: "casa" agrega segmentos com acordos financeiros muito diferentes. E necessario escolher quem e o primeiro comprador e quem sao os demais usuarios.
- **Problema primario indefinido**: o produto mistura memoria de despesas, divisao, fatura, orcamento, privacidade, governanca e reducao de conflitos. Sem hierarquia, qualquer feature parece justificavel.
- **Usuario e pagador indefinidos**: nao esta claro se todos os moradores devem usar o produto ou se um organizador registra tudo e os demais apenas conferem.
- **Frequencia da dor desconhecida**: nao ha evidencia de quantas casas fazem reconciliacao mensal, quanto tempo gastam ou com que frequencia erram.
- **Severidade desconhecida**: brigas sobre dinheiro podem decorrer de renda insuficiente, dividas, prioridades ou abuso, problemas que um ledger nao resolve.
- **Criterio de justica presumido**: renda proporcional foi tratada como resposta natural, mas justica domestica e um acordo social, nao apenas uma formula.
- **Disposicao a compartilhar dados**: renda, gastos e cartoes sao sensiveis. Nao foi validado se usuarios aceitarao centraliza-los em uma nova plataforma.
- **Diferenciacao comercial indefinida**: os concorrentes ja cobrem divisao, saldo, recorrencia e simplificacao. O diferencial brasileiro de faturas e parcelamentos e plausivel, mas ainda nao foi testado como motivo de troca ou pagamento.
- **Evidencias anteriores insuficientes**: percentuais macro citados em analises anteriores nao possuem referencias registradas e nao demonstram uso, retencao ou pagamento pelo produto.

### Edge Cases

- **Apenas uma pessoa adere**: o organizador registra tudo, mas o parceiro nao confere nem aceita os acertos; o produto vira uma planilha mais trabalhosa.
- **Ledger incompleto**: despesas esquecidas produzem saldos incorretos e podem aumentar a desconfianca.
- **Renda ausente ou deliberadamente nao compartilhada**: a estimativa pela media cria um acordo que os moradores nunca fizeram.
- **Gasto privado em cartao de terceiro**: ocultar detalhes do dono do passivo impediria conciliacao; exibi-los pode frustrar a expectativa de privacidade do comprador.
- **Relacao com controle ou abuso financeiro**: auditoria e transparencia podem ser usadas para vigilancia. O produto nao deve alegar seguranca relacional sem pesquisa e protecoes especificas.
- **Mudanca de acordo no meio do mes**: percentuais e participantes podem variar; gastos passados precisam preservar o acordo aceito no momento do registro.
- **Abandono depois do acerto**: o usuario pode perceber valor apenas uma vez e nao manter o habito de registrar, impedindo recorrencia e receita.
- **Alternativa suficientemente boa**: grupos com poucas despesas podem resolver tudo com um Pix e uma mensagem, sem necessidade de software dedicado.

### Technical Risks

- **Ausencia de telemetria de produto**: sem eventos de ativacao e retencao, a equipe nao consegue distinguir falha de proposta, onboarding ou usabilidade.
- **Carga de entrada manual**: o valor depende de dados completos, mas nao ha importacao bancaria, leitura de comprovante ou automacao de transacoes. Um fluxo longo por despesa pode inviabilizar o habito.
- **Dependencia de rede entre usuarios**: a casa precisa de mais de uma pessoa e de acordo operacional. O onboarding possui maior friccao que um aplicativo individual.
- **Promessa de confianca acima das garantias**: auditoria e mascaramento ja existem, mas a consistencia das regras em todos os fluxos e o bloqueio de alteracoes historicas precisam ser tratados como requisito de credibilidade, nao apenas detalhe tecnico.
- **Dados financeiros sensiveis**: renda, historico de compras e relacoes entre moradores elevam o impacto de incidentes de acesso, vazamento ou uso indevido.
- **Modelo de receita inexistente no dominio**: custos de hospedagem, email e suporte podem crescer sem limite, plano ou unidade economica definida.

### Acceptance Criteria Coverage

| AC# | Description | Addressable? | Gaps/Notes |
|-----|-------------|--------------|------------|
| 1 | Analisar o modelo de negocio atual | Sim | O codigo revela segmento amplo, proposta funcional de ledger domestico e ausencia de receita implementada. Custos, canais e tracao nao estao documentados. |
| 2 | Avaliar se o modelo esta ancorado na realidade | Sim | A categoria e real, mas problema-solucao, segmento, retencao e pagamento permanecem nao validados. |
| 3 | Identificar suposicoes nao validadas sobre o problema | Sim | Foram explicitadas hipoteses sobre conflito, justica por renda, privacidade, adesao coletiva, entrada manual e diferenciacao. |
| 4 | Questionar se o problema existe e e sentido pelo publico | Parcial | Evidencias externas confirmam a categoria e problemas financeiros em relacionamentos; faltam entrevistas e comportamento do publico brasileiro escolhido. |
| 5 | Avaliar se a solucao condiz com o contexto real | Parcial | Faturas, parcelamentos e fechamento mensal sao coerentes com o contexto proposto; renda presumida, privacidade e fluxo manual exigem validacao direta. |
| 6 | Sugerir iteracoes para aumentar aderencia e evitar desperdicio | Sim | Foram definidos foco inicial, reposicionamento, oito experimentos, metricas comportamentais e regra de descarte. |

### Evidence References

- Splitwise. Product capabilities and target contexts: https://www.splitwise.com/
- Splitwise Pro. Paid differentiation and default percentage splits: https://www.splitwise.com/pro
- tricount. Couples, roommates, expense tracking and company-reported adoption: https://tricount.com/
- Garbinsky, Gladstone, Nikolova e Olson. *Love, Lies, and Money: Financial Infidelity in Romantic Relationships*, Journal of Consumer Research: https://academic.oup.com/jcr/article/47/1/1/5610529

