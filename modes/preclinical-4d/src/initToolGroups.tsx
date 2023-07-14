const toolGroupIds = {
  default: 'dynamic4D-default',
  PT: 'dynamic4D-pt',
  Fusion: 'dynamic4D-fusion',
};

function _initToolGroups(toolNames, Enums, toolGroupService, commandsManager) {
  console.log('>>>>> _initToolGroups :: toolNames ::', toolNames);

  const tools = {
    active: [
      {
        toolName: toolNames.WindowLevel,
        bindings: [{ mouseButton: Enums.MouseBindings.Primary }],
      },
      {
        toolName: toolNames.Pan,
        bindings: [{ mouseButton: Enums.MouseBindings.Auxiliary }],
      },
      {
        toolName: toolNames.Zoom,
        bindings: [{ mouseButton: Enums.MouseBindings.Secondary }],
      },
      { toolName: toolNames.StackScrollMouseWheel, bindings: [] },
    ],
    passive: [
      { toolName: toolNames.Length },
      { toolName: toolNames.ArrowAnnotate },
      { toolName: toolNames.Bidirectional },
      { toolName: toolNames.DragProbe },
      { toolName: toolNames.Probe },
      { toolName: toolNames.EllipticalROI },
      { toolName: toolNames.RectangleROI },
      { toolName: toolNames.RectangleROIThreshold },
      { toolName: toolNames.StackScroll },
      { toolName: toolNames.Angle },
      { toolName: toolNames.CobbAngle },
      { toolName: toolNames.Magnify },
    ],
    enabled: [{ toolName: toolNames.SegmentationDisplay }],
    disabled: [{ toolName: toolNames.Crosshairs }],
  };

  const toolsConfig = {
    [toolNames.Crosshairs]: {
      viewportIndicators: false,
      autoPan: {
        enabled: false,
        panSize: 10,
      },
    },
    [toolNames.ArrowAnnotate]: {
      getTextCallback: (callback, eventDetails) => {
        commandsManager.runCommand('arrowTextCallback', {
          callback,
          eventDetails,
        });
      },

      changeTextCallback: (data, eventDetails, callback) =>
        commandsManager.runCommand('arrowTextCallback', {
          callback,
          data,
          eventDetails,
        }),
    },
  };

  toolGroupService.createToolGroupAndAddTools(
    toolGroupIds.PT,
    {
      active: tools.active,
      passive: [
        ...tools.passive,
        { toolName: 'RectangleROIStartEndThreshold' },
      ],
      enabled: tools.enabled,
      disabled: tools.disabled,
    },
    toolsConfig
  );

  toolGroupService.createToolGroupAndAddTools(
    toolGroupIds.Fusion,
    tools,
    toolsConfig
  );

  toolGroupService.createToolGroupAndAddTools(
    toolGroupIds.default,
    tools,
    toolsConfig
  );
}

function initToolGroups({
  toolNames,
  Enums,
  toolGroupService,
  commandsManager,
}) {
  _initToolGroups(toolNames, Enums, toolGroupService, commandsManager);
}

export { initToolGroups as default, toolGroupIds };
