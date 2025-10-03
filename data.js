// Sample data for deputies and voting records
const deputiesData = [
    {
        id: 1,
        name: "Ana Silva",
        party: "PT",
        state: "SP",
        email: "ana.silva@camara.leg.br",
        phone: "(11) 3333-4444",
        bio: "Deputada Federal com foco em educação e direitos sociais. Formada em Pedagogia pela USP, atua há 12 anos no parlamento. Presidente da Comissão de Educação."
    },
    {
        id: 2,
        name: "Carlos Mendes",
        party: "PSDB",
        state: "RJ",
        email: "carlos.mendes@camara.leg.br",
        phone: "(21) 3333-5555",
        bio: "Economista e deputado federal com três mandatos. Especialista em políticas fiscais e desenvolvimento econômico. Membro da Comissão de Finanças e Tributação."
    },
    {
        id: 3,
        name: "Maria Santos",
        party: "PSOL",
        state: "BA",
        email: "maria.santos@camara.leg.br",
        phone: "(71) 3333-6666",
        bio: "Ativista de direitos humanos eleita pela primeira vez em 2022. Advogada formada pela UFBA, com atuação em defesa das minorias e populações vulneráveis."
    },
    {
        id: 4,
        name: "João Oliveira",
        party: "MDB",
        state: "MG",
        email: "joao.oliveira@camara.leg.br",
        phone: "(31) 3333-7777",
        bio: "Empresário e político com experiência em gestão pública. Prefeito de sua cidade por dois mandatos antes de ser eleito deputado federal. Foco em infraestrutura."
    },
    {
        id: 5,
        name: "Paula Costa",
        party: "PL",
        state: "RS",
        email: "paula.costa@camara.leg.br",
        phone: "(51) 3333-8888",
        bio: "Médica e deputada federal eleita em 2018. Presidente da Frente Parlamentar da Saúde. Defensora de políticas públicas de saúde e qualidade de vida."
    },
    {
        id: 6,
        name: "Roberto Ferreira",
        party: "PDT",
        state: "CE",
        email: "roberto.ferreira@camara.leg.br",
        phone: "(85) 3333-9999",
        bio: "Engenheiro civil e parlamentar com foco em desenvolvimento regional. Autor de diversos projetos de infraestrutura para o Nordeste. Membro da Comissão de Desenvolvimento Regional."
    },
    {
        id: 7,
        name: "Juliana Rocha",
        party: "NOVO",
        state: "SC",
        email: "juliana.rocha@camara.leg.br",
        phone: "(48) 3333-0000",
        bio: "Empreendedora e deputada estreante. Formada em Administração, defende políticas de desburocratização e simplificação tributária para pequenos negócios."
    },
    {
        id: 8,
        name: "Fernando Lima",
        party: "PT",
        state: "PE",
        email: "fernando.lima@camara.leg.br",
        phone: "(81) 3333-1111",
        bio: "Ex-sindicalista e líder trabalhista. Deputado há 16 anos, presidente da Comissão de Trabalho. Defensor dos direitos dos trabalhadores e políticas de emprego."
    }
];

const votingsData = [
    {
        id: 1,
        title: "PL 1234/2024 - Reforma do Ensino Superior",
        description: "Projeto de lei que propõe mudanças na estrutura do ensino superior brasileiro, incluindo financiamento e acesso.",
        date: "15/01/2024",
        votes: [
            { deputyId: 1, deputyName: "Ana Silva", vote: "sim" },
            { deputyId: 2, deputyName: "Carlos Mendes", vote: "nao" },
            { deputyId: 3, deputyName: "Maria Santos", vote: "sim" },
            { deputyId: 4, deputyName: "João Oliveira", vote: "nao" },
            { deputyId: 5, deputyName: "Paula Costa", vote: "abstencao" },
            { deputyId: 6, deputyName: "Roberto Ferreira", vote: "sim" },
            { deputyId: 7, deputyName: "Juliana Rocha", vote: "nao" },
            { deputyId: 8, deputyName: "Fernando Lima", vote: "sim" }
        ]
    },
    {
        id: 2,
        title: "PEC 45/2023 - Reforma Tributária",
        description: "Proposta de Emenda Constitucional que reforma o sistema tributário brasileiro, simplificando impostos e contribuições.",
        date: "20/02/2024",
        votes: [
            { deputyId: 1, deputyName: "Ana Silva", vote: "sim" },
            { deputyId: 2, deputyName: "Carlos Mendes", vote: "sim" },
            { deputyId: 3, deputyName: "Maria Santos", vote: "abstencao" },
            { deputyId: 4, deputyName: "João Oliveira", vote: "sim" },
            { deputyId: 5, deputyName: "Paula Costa", vote: "sim" },
            { deputyId: 6, deputyName: "Roberto Ferreira", vote: "sim" },
            { deputyId: 7, deputyName: "Juliana Rocha", vote: "sim" },
            { deputyId: 8, deputyName: "Fernando Lima", vote: "nao" }
        ]
    },
    {
        id: 3,
        title: "PL 5678/2024 - Política Nacional de Saúde Mental",
        description: "Projeto que estabelece diretrizes para a política nacional de saúde mental, com foco em prevenção e tratamento.",
        date: "10/03/2024",
        votes: [
            { deputyId: 1, deputyName: "Ana Silva", vote: "sim" },
            { deputyId: 2, deputyName: "Carlos Mendes", vote: "sim" },
            { deputyId: 3, deputyName: "Maria Santos", vote: "sim" },
            { deputyId: 4, deputyName: "João Oliveira", vote: "sim" },
            { deputyId: 5, deputyName: "Paula Costa", vote: "sim" },
            { deputyId: 6, deputyName: "Roberto Ferreira", vote: "sim" },
            { deputyId: 7, deputyName: "Juliana Rocha", vote: "sim" },
            { deputyId: 8, deputyName: "Fernando Lima", vote: "sim" }
        ]
    },
    {
        id: 4,
        title: "PL 9012/2024 - Infraestrutura Digital no Interior",
        description: "Projeto de lei para expansão da infraestrutura de internet e telefonia em áreas rurais e cidades do interior.",
        date: "25/03/2024",
        votes: [
            { deputyId: 1, deputyName: "Ana Silva", vote: "sim" },
            { deputyId: 2, deputyName: "Carlos Mendes", vote: "sim" },
            { deputyId: 3, deputyName: "Maria Santos", vote: "sim" },
            { deputyId: 4, deputyName: "João Oliveira", vote: "sim" },
            { deputyId: 5, deputyName: "Paula Costa", vote: "nao" },
            { deputyId: 6, deputyName: "Roberto Ferreira", vote: "sim" },
            { deputyId: 7, deputyName: "Juliana Rocha", vote: "abstencao" },
            { deputyId: 8, deputyName: "Fernando Lima", vote: "sim" }
        ]
    },
    {
        id: 5,
        title: "PL 3456/2024 - Lei de Proteção ao Trabalhador",
        description: "Projeto que amplia direitos trabalhistas e estabelece novas regras de proteção ao emprego.",
        date: "05/04/2024",
        votes: [
            { deputyId: 1, deputyName: "Ana Silva", vote: "sim" },
            { deputyId: 2, deputyName: "Carlos Mendes", vote: "nao" },
            { deputyId: 3, deputyName: "Maria Santos", vote: "sim" },
            { deputyId: 4, deputyName: "João Oliveira", vote: "nao" },
            { deputyId: 5, deputyName: "Paula Costa", vote: "nao" },
            { deputyId: 6, deputyName: "Roberto Ferreira", vote: "sim" },
            { deputyId: 7, deputyName: "Juliana Rocha", vote: "nao" },
            { deputyId: 8, deputyName: "Fernando Lima", vote: "sim" }
        ]
    }
];
