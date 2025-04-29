# GliMind - Monitoramento de Diabetes

![GliMind Preview](https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=800&h=400&fit=crop)

GliMind é uma aplicação web moderna para monitoramento de diabetes, permitindo o registro e acompanhamento de glicemia, refeições e uso de insulina.

## 🚀 Tecnologias

- **Frontend**
  - React 18
  - TypeScript
  - Vite
  - Tailwind CSS
  - Lucide React (ícones)
  - Chart.js & React-Chartjs-2
  - Date-fns

- **Backend & Database**
  - Supabase (PostgreSQL)
  - Row Level Security (RLS)
  - Autenticação integrada

## ✨ Funcionalidades

### Monitoramento de Glicemia
- Registro de medições com horário
- Categorização por momento do dia (jejum, pré/pós refeições)
- Alertas inteligentes baseados nos níveis
- Recomendações personalizadas
- Visualização em gráficos

### Registro de Refeições
- Catálogo de alimentos pré-definidos
- Adição de alimentos personalizados
- Identificação de alimentos com alto índice glicêmico
- Histórico de refeições

### Controle de Insulina
- Registro de aplicações
- Cálculo de doses sugeridas
- Histórico de uso
- Gráficos de acompanhamento

### Dashboard
- Visão geral dos dados
- Gráficos interativos
- Estatísticas importantes
- Histórico recente

### Segurança
- Autenticação de usuários
- Proteção de dados por usuário
- Criptografia de ponta a ponta
- Conformidade com práticas de segurança

## 🔧 Como Usar

1. **Instalação**
   ```bash
   npm install
   ```

2. **Configuração do Ambiente**
   - Crie um arquivo `.env` na raiz do projeto
   - Adicione as variáveis do Supabase:
     ```
     VITE_SUPABASE_URL=sua_url
     VITE_SUPABASE_ANON_KEY=sua_chave
     ```

3. **Desenvolvimento**
   ```bash
   npm run dev
   ```

4. **Build para Produção**
   ```bash
   npm run build
   ```

## 📱 Responsividade

A aplicação é totalmente responsiva e otimizada para:
- Desktops
- Tablets
- Smartphones

## 🔜 Próximas Atualizações

### Versão 1.1
- [ ] Exportação de relatórios em PDF
- [ ] Compartilhamento com profissionais de saúde
- [ ] Lembretes personalizados

### Versão 1.2
- [ ] Integração com dispositivos de medição
- [ ] Modo offline
- [ ] Notificações push

### Versão 1.3
- [ ] Análise preditiva de tendências
- [ ] Recomendações baseadas em IA
- [ ] Integração com apps de atividade física

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Suporte

Para suporte e dúvidas, por favor abra uma issue no GitHub ou entre em contato através do email: suporte@glimind.com

---

Desenvolvido com ❤️ por [Labora Tech](https://labora-tech.com/)