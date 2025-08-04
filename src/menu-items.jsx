const menuItems = {
  items: [
    {
      id: 'navigation',
      title: 'Navigation',
      type: 'group',
      icon: 'icon-navigation',
      children: [
        {
          id: 'dashboard',
          title: 'Dashboard',
          type: 'item',
          icon: 'feather icon-home',
          url: '/app/dashboard'
        },
        {
          id: 'caseintakes',
          title: 'Case Intakes',
          type: 'item',
          url: '/case-intakes',
          classes: 'nav-item',
          icon: 'feather icon-sidebar'
        },
        {
          id: 'patientcases',
          title: 'Patient Cases',
          type: 'item',
          url: '/patient-cases',
          classes: 'nav-item',
          icon: 'feather icon-sidebar'
        },
        {
          id: 'repertory',
          title: 'Repertory',
          type: 'item',
          url: '/repertory',
          classes: 'nav-item',
          icon: 'feather icon-sidebar'
        },
        {
          id: 'materia-medica',
          title: 'Materia Medica',
          type: 'item',
          url: '/meteria-medica',
          classes: 'nav-item',
          icon: 'feather icon-sidebar'
        },
        {
          id: 'expert-system',
          title: 'Expert System',
          type: 'item',
          url: '/expert-system',
          classes: 'nav-item',
          icon: 'feather icon-sidebar'
        },
        {
          id: 'aidiagnosis',
          title: 'AI Diagnosis',
          type: 'item',
          url: '/ai-diagnosis',
          classes: 'nav-item',
          icon: 'feather icon-sidebar'
        },
        {
          id: 'labreports',
          title: 'Lab Reports',
          type: 'item',
          url: '/lab-reports',
          classes: 'nav-item',
          icon: 'feather icon-sidebar'
        },
        {
          id: 'remedy-suggestion',
          title: 'Remedy Suggestion',
          type: 'item',
          url: '/remedy-suggestion',
          classes: 'nav-item',
          icon: 'feather icon-sidebar'
        },
        {
          id: 'consultation',
          title: 'Consultation',
          type: 'item',
          url: '/consultation',
          classes: 'nav-item',
          icon: 'feather icon-sidebar'
        },
        {
          id: 'qrgenerator',
          title: 'QR Generator',
          type: 'item',
          url: '/qr-generator',
          classes: 'nav-item',
          icon: 'feather icon-sidebar'
        },
      ]
    }
  ]
};

export default menuItems;
