export type Language = 'pl' | 'en';

export interface Translations {
  
  stats: {
    title: string;
    routes: string;
    sensors: string;
    detections: string;
  };
  
  
  detectionPanel: {
    title: string;
    noDetections: string;
    sensor: string;
    route: string;
    intensity: string;
    frequency: string;
  };
  
  
  deploymentDialog: {
    title: string;
    subtitle: string;
    startPoint: string;
    endPoint: string;
    clickMap: string;
    distance: string;
    sensorSpacing: string;
    spacingOptions: {
      dense: string;
      standard: string;
      wide: string;
    };
    costRange: string;
    weightRange: string;
    sensorsCount: string;
    deploy: string;
    cancel: string;
    fenceInfra: string;
    fenceCabling: string;
    fenceCableType: string;
    fencePower: string;
    fencePowerVoltage: string;
    fencePostSpacing: string;
  };
  
  
  map: {
    fullscreen: string;
    exitFullscreen: string;
    searchPlaceholder: string;
    searching: string;
    noResults: string;
    sensor: string;
    route: string;
    selectStart: string;
    selectEnd: string;
    addPoint: string;
    removePoint: string;
    editSensors: string;
    drone: string;
    detection: string;
    planRoute: string;
    close: string;
    reset: string;
    done: string;
    plannedRoute: string;
    start: string;
    end: string;
    distance: string;
    editRoute: string;
    removeRoute: string;
    clickOnMap: string;
  editSensorsHint: string;
  };

  mapStyle: {
    label: string;
    street: string;
    satellite: string;
  };
  
  
  language: {
    polish: string;
    english: string;
  };
  
  
  theme: {
    label: string;
    light: string;
    dark: string;
    auto: string;
    lightTitle: string;
    darkTitle: string;
    autoTitle: string;
  };
  
  app: {
    title: string;
    subtitle: string;
  };

  zone: {
    title: string;
    draw: string;
    drawing: string;
    clear: string;
    done: string;
    points: string;
    perimeter: string;
    sensors: string;
    spacing: string;
    count: string;
    cost: string;
    weight: string;
    deploy: string;
    needPoints: string;
    objects: string;
  };
}

export const translations: Record<Language, Translations> = {
  pl: {
    stats: {
      title: 'Statystyki',
      routes: 'Trasy monitorowania',
      sensors: 'Czujniki',
      detections: 'Aktywne wykrycia',
    },
    detectionPanel: {
      title: 'Wykrycia dronów',
      noDetections: 'Brak aktywnych wykryć',
      sensor: 'Czujnik',
      route: 'Trasa',
      intensity: 'Intensywność',
      frequency: 'Częstotliwość',
    },
    deploymentDialog: {
      title: 'Nowe wdrożenie czujników',
      subtitle: 'Wybierz punkty początkowy i końcowy na mapie',
      startPoint: 'Punkt początkowy',
      endPoint: 'Punkt końcowy',
      clickMap: 'Kliknij na mapie aby wybrać',
      distance: 'Dystans',
      sensorSpacing: 'Rozstaw czujników',
      spacingOptions: {
        dense: 'Gęsty',
        standard: 'Standard',
        wide: 'Szeroki',
      },
      costRange: 'Szacowany koszt',
      weightRange: 'Waga sprzętu',
      sensorsCount: 'Liczba czujników',
      deploy: 'Wdróż',
      cancel: 'Anuluj',
      fenceInfra: 'Infrastruktura ogrodzenia',
      fenceCabling: 'Okablowanie',
      fenceCableType: 'Typ kabla',
      fencePower: 'Zasilanie',
      fencePowerVoltage: 'Napięcie (V)',
      fencePostSpacing: 'Rozstaw słupków (m)',
    },
    map: {
      fullscreen: 'Pełny ekran',
      exitFullscreen: 'Wyjdź z pełnego ekranu',
      searchPlaceholder: 'Szukaj miejsca...',
      searching: 'Wyszukiwanie...',
      noResults: 'Brak wyników',
      sensor: 'Czujnik',
      route: 'Trasa',
      selectStart: 'Wybierz punkt początkowy',
      selectEnd: 'Wybierz punkt końcowy',
      addPoint: 'Kolejny punkt',
      removePoint: 'Cofnij punkt',
      editSensors: 'Edytuj czujniki',
      drone: 'Dron',
      detection: 'Wykrycie',
      planRoute: 'Rozłóż sieć czujników',
      close: 'Zamknij',
      reset: 'Resetuj',
      done: 'Gotowe',
      plannedRoute: 'Zaplanowana trasa',
      start: 'Start',
      end: 'Koniec',
      distance: 'Dystans',
      editRoute: 'Edytuj trasę',
      removeRoute: 'Usuń trasę',
      clickOnMap: 'KLIKNIJ NA MAPIE',
    editSensorsHint: 'Kliknij na mapę, aby dodać czujnik. Kliknij na istniejący czujnik, aby go usunąć. Przeciągnij czujnik, aby go przesunąć.',
    },
    mapStyle: {
      label: 'Widok mapy:',
      street: 'Mapa',
      satellite: 'Satelita',
    },
    language: {
      polish: 'Polski',
      english: 'Angielski',
    },
    theme: {
      label: 'Motyw:',
      light: 'Jasny',
      dark: 'Ciemny',
      auto: 'Systemowy',
      lightTitle: 'Motyw jasny',
      darkTitle: 'Motyw ciemny',
      autoTitle: 'Motyw systemowy',
    },
    app: {
      title: 'EUDIS',
      subtitle: 'System monitorowania dronów z wykorzystaniem sensorów audio',
    },
    zone: {
      title: 'Chroń obiekt',
      draw: 'Rysuj granicę',
      drawing: 'Rysowanie…',
      clear: 'Wyczyść',
      done: 'Zakończ',
      points: 'punkty',
      perimeter: 'Obwód',
      sensors: 'Czujniki na ogrodzeniu',
      spacing: 'Rozstaw',
      count: 'Czujniki',
      cost: 'Koszt (PLN)',
      weight: 'Waga (kg)',
      deploy: 'Wdróż obiekt',
      needPoints: 'Zaznacz min. 3 punkty na mapie',
      objects: 'Obiekty chronione',
    },
  },
  en: {
    stats: {
      title: 'Statistics',
      routes: 'Monitoring Routes',
      sensors: 'Sensors',
      detections: 'Active Detections',
    },
    detectionPanel: {
      title: 'Drone Detections',
      noDetections: 'No active detections',
      sensor: 'Sensor',
      route: 'Route',
      intensity: 'Intensity',
      frequency: 'Frequency',
    },
    deploymentDialog: {
      title: 'New Sensor Deployment',
      subtitle: 'Select start and end points on the map',
      startPoint: 'Start Point',
      endPoint: 'End Point',
      clickMap: 'Click on map to select',
      distance: 'Distance',
      sensorSpacing: 'Sensor Spacing',
      spacingOptions: {
        dense: 'Dense',
        standard: 'Standard',
        wide: 'Wide',
      },
      costRange: 'Estimated Cost',
      weightRange: 'Equipment Weight',
      sensorsCount: 'Number of Sensors',
      deploy: 'Deploy',
      cancel: 'Cancel',
      fenceInfra: 'Fence Infrastructure',
      fenceCabling: 'Cabling',
      fenceCableType: 'Cable type',
      fencePower: 'Power supply',
      fencePowerVoltage: 'Voltage (V)',
      fencePostSpacing: 'Post spacing (m)',
    },
    map: {
      fullscreen: 'Fullscreen',
      exitFullscreen: 'Exit Fullscreen',
      searchPlaceholder: 'Search for a place...',
      searching: 'Searching...',
      noResults: 'No results',
      sensor: 'Sensor',
      route: 'Route',
      selectStart: 'Select start point',
      selectEnd: 'Select end point',
      addPoint: 'Next point',
      removePoint: 'Undo point',
      editSensors: 'Edit sensors',
      drone: 'Drone',
      detection: 'Detection',
      planRoute: 'Deploy Sensor Network',
      close: 'Close',
      reset: 'Reset',
      done: 'Done',
      plannedRoute: 'Planned Route',
      start: 'Start',
      end: 'End',
      distance: 'Distance',
      editRoute: 'Edit Route',
      removeRoute: 'Remove Route',
      clickOnMap: 'CLICK ON MAP',
    editSensorsHint: 'Click on the map to add a sensor. Click on an existing sensor to remove it. Drag a sensor to move it.',
    },
    mapStyle: {
      label: 'Map view:',
      street: 'Map',
      satellite: 'Satellite',
    },
    language: {
      polish: 'Polish',
      english: 'English',
    },
    theme: {
      label: 'Theme:',
      light: 'Light',
      dark: 'Dark',
      auto: 'System',
      lightTitle: 'Light theme',
      darkTitle: 'Dark theme',
      autoTitle: 'System theme',
    },
    app: {
      title: 'EUDIS',
      subtitle: 'Drone monitoring system using audio sensors',
    },
    zone: {
      title: 'Protect Object',
      draw: 'Draw boundary',
      drawing: 'Drawing…',
      clear: 'Clear',
      done: 'Done',
      points: 'points',
      perimeter: 'Perimeter',
      sensors: 'Sensors on fence',
      spacing: 'Spacing',
      count: 'Sensors',
      cost: 'Cost (PLN)',
      weight: 'Weight (kg)',
      deploy: 'Deploy object',
      needPoints: 'Mark at least 3 points on map',
      objects: 'Protected objects',
    },
  },
};
