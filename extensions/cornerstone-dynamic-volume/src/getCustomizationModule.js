import StepProgressDropdownWithService from './components/StepProgressDropdownWithService';

function getCustomizationModule() {
  return [
    {
      name: 'stepProgressDropdownComponent',
      value: {
        id: 'stepProgressDropdownComponent',
        component: StepProgressDropdownWithService,
      },
    },
  ];
}

export default getCustomizationModule;
