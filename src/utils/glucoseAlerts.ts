import { format, parse } from 'date-fns';

export interface GlucoseAlert {
  message: string;
  type: 'danger' | 'warning' | 'success';
  recommendation?: string;
  insulinUnits?: number;
}

const isLunchTime = (timestamp: string): boolean => {
  const date = parse(timestamp, "yyyy-MM-dd'T'HH:mm", new Date());
  const hours = date.getHours();
  return hours >= 11 && hours <= 14;
}

export const getGlucoseAlert = (glucoseLevel: number, timestamp: string): GlucoseAlert => {
  // Hipoglicemia
  if (glucoseLevel < 70) {
    return {
      message: 'Glicemia muito baixa!',
      type: 'danger',
      recommendation: 'Ingerir imediatamente um carboidrato de rápida absorção (como suco, mel ou balas). Reavaliar em 15 minutos.'
    };
  }

  // Glicemia normal
  if (glucoseLevel >= 70 && glucoseLevel <= 139) {
    const isLunch = isLunchTime(timestamp);
    return {
      message: 'Glicemia dentro do esperado',
      type: 'success',
      recommendation: isLunch 
        ? 'Aplique 1 unidade de insulina para a refeição.'
        : 'Não é necessário aplicar insulina.',
      insulinUnits: isLunch ? 1 : 0
    };
  }

  // Glicemia alta
  if (glucoseLevel >= 140 && glucoseLevel <= 250) {
    const isLunch = isLunchTime(timestamp);
    return {
      message: 'Glicemia alta',
      type: 'warning',
      recommendation: isLunch
        ? 'Aplique 2 unidades de insulina rápida.'
        : 'Aplique 1 unidade de insulina rápida.',
      insulinUnits: isLunch ? 2 : 1
    };
  }

  // Glicemia muito alta
  const isLunch = isLunchTime(timestamp);
  return {
    message: 'Glicemia muito alta!',
    type: 'danger',
    recommendation: isLunch
      ? 'Aplique 3 unidades de insulina rápida e monitore após a refeição.'
      : 'Aplique 2 unidades de insulina rápida e monitore após 2 horas.',
    insulinUnits: isLunch ? 3 : 2
  };
};