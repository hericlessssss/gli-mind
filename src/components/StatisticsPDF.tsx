import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { format, parseISO } from 'date-fns';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#FFFFFF',
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 30,
    borderBottom: '2px solid #E5E7EB',
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    color: '#00a3ff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 14,
    color: '#374151',
    backgroundColor: '#F3F4F6',
    padding: 8,
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 4,
  },
  statLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    color: '#111827',
    fontWeight: 'bold',
  },
  readingItem: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 4,
  },
  readingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  readingValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  normalReading: {
    color: '#059669',
  },
  highReading: {
    color: '#DC2626',
  },
  lowReading: {
    color: '#D97706',
  },
  readingTime: {
    fontSize: 10,
    color: '#6B7280',
  },
  mealInfo: {
    fontSize: 10,
    color: '#4B5563',
    marginTop: 4,
  },
  mealItems: {
    marginTop: 6,
    paddingLeft: 8,
  },
  mealItem: {
    fontSize: 9,
    color: '#6B7280',
    marginBottom: 2,
  },
  notes: {
    fontSize: 9,
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 4,
    paddingLeft: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#9CA3AF',
    borderTop: '1px solid #E5E7EB',
    paddingTop: 10,
  },
});

interface GlucoseReading {
  glucose_level: number;
  timestamp: string;
  meal_type: string;
  insulin_applied: boolean;
  insulin_units: number | null;
  meal_items?: Array<{
    name: string;
    high_glycemic: boolean;
  }>;
  notes?: string | null;
}

interface Stats {
  average: number;
  highest: number;
  lowest: number;
  total: number;
  totalInsulin: number;
}

interface StatisticsPDFProps {
  readings: GlucoseReading[];
  stats: Stats;
  userName: string;
}

const MEAL_TYPE_LABELS: Record<string, string> = {
  fasting: 'Ao acordar',
  pre_breakfast: 'Pré café',
  post_breakfast: 'Pós café',
  pre_lunch: 'Pré almoço',
  post_lunch: 'Pós almoço',
  pre_dinner: 'Pré jantar',
  post_dinner: 'Pós jantar',
  bedtime: 'Antes de dormir',
};

const getReadingStyle = (level: number) => {
  if (level < 70) return styles.lowReading;
  if (level > 180) return styles.highReading;
  return styles.normalReading;
};

export const StatisticsPDF: React.FC<StatisticsPDFProps> = ({ readings, stats, userName }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>Relatório de Glicemia</Text>
        <Text style={styles.subtitle}>
          Paciente: {userName}{'\n'}
          Período: {format(parseISO(readings[readings.length - 1]?.timestamp || new Date().toISOString()), 'dd/MM/yyyy')} até {format(parseISO(readings[0]?.timestamp || new Date().toISOString()), 'dd/MM/yyyy')}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Resumo</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Média Geral</Text>
            <Text style={styles.statValue}>{stats.average} mg/dL</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Medições</Text>
            <Text style={styles.statValue}>{stats.total}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Maior Valor</Text>
            <Text style={styles.statValue}>{stats.highest} mg/dL</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Menor Valor</Text>
            <Text style={styles.statValue}>{stats.lowest} mg/dL</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Total de Insulina</Text>
            <Text style={styles.statValue}>{stats.totalInsulin} un</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Registros Detalhados</Text>
        {readings.map((reading, index) => (
          <View key={index} style={styles.readingItem}>
            <View style={styles.readingHeader}>
              <Text style={[styles.readingValue, getReadingStyle(reading.glucose_level)]}>
                {reading.glucose_level} mg/dL
              </Text>
              <Text style={styles.readingTime}>
                {format(parseISO(reading.timestamp), "dd/MM/yyyy 'às' HH:mm")}
              </Text>
            </View>
            
            <Text style={styles.mealInfo}>
              {MEAL_TYPE_LABELS[reading.meal_type]}
              {reading.insulin_applied && reading.insulin_units
                ? ` • ${reading.insulin_units} unidades de insulina`
                : ''}
            </Text>

            {reading.meal_items && reading.meal_items.length > 0 && (
              <View style={styles.mealItems}>
                {reading.meal_items.map((item, idx) => (
                  <Text key={idx} style={styles.mealItem}>
                    • {item.name}{item.high_glycemic ? ' (Alto IG)' : ''}
                  </Text>
                ))}
              </View>
            )}

            {reading.notes && (
              <Text style={styles.notes}>
                Obs: {reading.notes}
              </Text>
            )}
          </View>
        ))}
      </View>

      <Text style={styles.footer}>
        Relatório gerado por GliMind em {format(new Date(), "dd/MM/yyyy 'às' HH:mm")}
      </Text>
    </Page>
  </Document>
);