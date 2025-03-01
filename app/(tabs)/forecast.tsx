import React, { useState } from 'react';
import { ScrollView, StyleSheet, View, Dimensions } from 'react-native';
import { Card, Text, Surface, useTheme, List, Chip, ProgressBar, Dialog, Portal, Button } from 'react-native-paper';
import { useData } from '../../context/DataContext';
import { 
  calculateMonthlyStats, 
  generateForecast,
  analyzeSpendingPatterns,
  generateFinancialInsights,
  assessFinancialRisk,
  generateAIRecommendations,
  generateMonthlyForecast,
  FinancialInsight,
  AIRecommendation
} from '../../utils/financialForecasting';
import { format, subMonths } from 'date-fns';
import { AlertTriangle, TrendingUp, TrendingDown, Minus, Brain, Target, Shield, Lightbulb, ChevronRight, Calendar } from 'lucide-react-native';
import { LineChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

export default function ForecastScreen() {
  const theme = useTheme();
  const { transactions } = useData();
  
  // State for expandable dialogs
  const [selectedInsight, setSelectedInsight] = useState<FinancialInsight | null>(null);
  const [selectedRecommendation, setSelectedRecommendation] = useState<AIRecommendation | null>(null);
  
  const currentDate = new Date();
  const startDate = subMonths(currentDate, 6);
  const monthlyStats = calculateMonthlyStats(transactions, startDate, currentDate);
  const currentMonthStats = monthlyStats[monthlyStats.length - 1];
  const forecast = generateForecast(monthlyStats);
  
  const spendingPatterns = analyzeSpendingPatterns(transactions);
  const insights = generateFinancialInsights(transactions, currentMonthStats, spendingPatterns);
  const riskAssessment = assessFinancialRisk(currentMonthStats, spendingPatterns);
  const aiRecommendations = generateAIRecommendations(currentMonthStats, spendingPatterns, riskAssessment);
  
  // Generate future monthly forecast data
  const monthlyForecast = generateMonthlyForecast(monthlyStats, 6);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp size={20} color={theme.colors.error} />;
      case 'decreasing':
        return <TrendingDown size={20} color={theme.colors.primary} />;
      default:
        return <Minus size={20} color={theme.colors.secondary} />;
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <Target size={20} color={theme.colors.primary} />;
      case 'warning':
        return <AlertTriangle size={20} color={theme.colors.warning} />;
      case 'info':
        return <Brain size={20} color={theme.colors.tertiary} />;
      case 'danger':
        return <AlertTriangle size={20} color={theme.colors.error} />;
      default:
        return <Brain size={20} color={theme.colors.tertiary} />;
    }
  };

  const chartConfig = {
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
    labelColor: (opacity = 1) => theme.colors.onSurface,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#007AFF',
    },
  };

  // Prepare data for the future forecast chart
  const forecastChartData = {
    labels: monthlyForecast.map(item => item.month),
    datasets: [
      {
        data: monthlyForecast.map(item => Math.max(0, item.income)), // Ensure no negative values
        color: () => 'rgba(46, 204, 113, 1)', // Green for income
        strokeWidth: 2,
      },
      {
        data: monthlyForecast.map(item => Math.max(0, item.expenses)), // Ensure no negative values
        color: () => 'rgba(231, 76, 60, 1)', // Red for expenses
        strokeWidth: 2,
      },
      {
        data: monthlyForecast.map(item => Math.max(0, item.balance)), // Handle negative values separately
        color: () => 'rgba(52, 152, 219, 1)', // Blue for balance
        strokeWidth: 2,
      },
    ],
    legend: ['Income', 'Expenses', 'Balance'],
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Forecast Summary Card */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            <Brain size={20} color={theme.colors.primary} /> AI-Powered Forecast
          </Text>
          <View style={styles.forecastSummary}>
            <Surface style={[styles.forecastItem, { backgroundColor: theme.colors.primaryContainer }]}>
              <Text variant="labelMedium" style={[styles.forecastLabel, { color: theme.colors.onPrimaryContainer }]}>
                Predicted Income
              </Text>
              <Text variant="headlineSmall" style={[styles.forecastValue, { color: theme.colors.onPrimaryContainer }]}>
                ${forecast.predictedIncome}
              </Text>
            </Surface>
            <Surface style={[styles.forecastItem, { backgroundColor: theme.colors.errorContainer }]}>
              <Text variant="labelMedium" style={[styles.forecastLabel, { color: theme.colors.onErrorContainer }]}>
                Predicted Expenses
              </Text>
              <Text variant="headlineSmall" style={[styles.forecastValue, { color: theme.colors.onErrorContainer }]}>
                ${forecast.predictedExpenses}
              </Text>
            </Surface>
            <Surface style={[styles.forecastItem, { backgroundColor: theme.colors.secondaryContainer }]}>
              <Text variant="labelMedium" style={[styles.forecastLabel, { color: theme.colors.onSecondaryContainer }]}>
                Predicted Balance
              </Text>
              <Text variant="headlineSmall" style={[styles.forecastValue, { color: theme.colors.onSecondaryContainer }]}>
                ${forecast.predictedBalance}
              </Text>
            </Surface>
          </View>
        </Card.Content>
      </Card>

      {/* Risk Assessment */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            <Shield size={20} color={theme.colors.primary} /> Risk Assessment
          </Text>
          <View style={styles.riskContainer}>
            <Text variant="bodyLarge" style={styles.riskTitle}>
              Your financial risk level is{' '}
              <Text 
                style={[
                  styles.riskLevel, 
                  { 
                    color: 
                      riskAssessment.level === 'high' ? theme.colors.error : 
                      riskAssessment.level === 'medium' ? theme.colors.warning : 
                      theme.colors.primary 
                  }
                ]}
              >
                {riskAssessment.level}
              </Text>
            </Text>
            <ProgressBar 
              progress={
                riskAssessment.level === 'high' ? 0.9 : 
                riskAssessment.level === 'medium' ? 0.5 : 
                0.2
              } 
              color={
                riskAssessment.level === 'high' ? theme.colors.error : 
                riskAssessment.level === 'medium' ? theme.colors.warning : 
                theme.colors.primary
              }
              style={styles.riskProgressBar}
            />
          </View>
          <Text variant="bodyMedium" style={styles.riskFactorsTitle}>Risk Factors:</Text>
          <View style={styles.chipContainer}>
            {riskAssessment.factors.map((factor, index) => (
              <Chip
                key={index}
                style={styles.chip}
                textStyle={styles.chipText}
              >
                {factor}
              </Chip>
            ))}
          </View>
        </Card.Content>
      </Card>

      {/* Future Monthly Forecast */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            <Calendar size={20} color={theme.colors.primary} /> Future Monthly Forecast
          </Text>
          {monthlyForecast.length > 0 ? (
            <>
              <View style={styles.chartContainer}>
                <LineChart
                  data={forecastChartData}
                  width={screenWidth - 60}
                  height={220}
                  chartConfig={chartConfig}
                  bezier
                  style={styles.chart}
                  fromZero
                  yAxisSuffix=""
                  yAxisLabel="$"
                  verticalLabelRotation={0}
                  segments={4}
                  legend={forecastChartData.legend}
                />
              </View>
              <View style={styles.forecastLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: 'rgb(46, 204, 113)' }]} />
                  <Text style={styles.legendText}>Income</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: 'rgb(231, 76, 60)' }]} />
                  <Text style={styles.legendText}>Expenses</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: 'rgb(52, 152, 219)' }]} />
                  <Text style={styles.legendText}>Balance</Text>
                </View>
              </View>
              <Text style={styles.chartNote}>
                Forecast based on your past {monthlyStats.length} months of financial activity
              </Text>
            </>
          ) : (
            <Text style={styles.noDataText}>Not enough data for forecast</Text>
          )}
        </Card.Content>
      </Card>

      {/* AI Insights */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            <Brain size={20} color={theme.colors.primary} /> AI Financial Insights
          </Text>
          {insights.map((insight, index) => (
            <List.Item
              key={index}
              title={insight.title}
              description={insight.description.length > 80 ? `${insight.description.substring(0, 80)}...` : insight.description}
              left={props => getInsightIcon(insight.type)}
              right={props => <ChevronRight {...props} />}
              onPress={() => setSelectedInsight(insight)}
              style={styles.listItem}
            />
          ))}
        </Card.Content>
      </Card>

      {/* AI Recommendations */}
      <Card style={[styles.card, styles.lastCard]}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            <Lightbulb size={20} color={theme.colors.primary} /> Smart Recommendations
          </Text>
          {aiRecommendations.map((recommendation, index) => (
            <List.Item
              key={index}
              title={recommendation.title}
              description={recommendation.description.length > 80 ? `${recommendation.description.substring(0, 80)}...` : recommendation.description}
              left={props => <Lightbulb {...props} size={24} color={theme.colors.primary} />}
              right={props => <ChevronRight {...props} />}
              onPress={() => setSelectedRecommendation(recommendation)}
              style={styles.listItem}
            />
          ))}
        </Card.Content>
      </Card>

      {/* Insight Detail Dialog */}
      <Portal>
        <Dialog visible={!!selectedInsight} onDismiss={() => setSelectedInsight(null)}>
          <Dialog.Title>{selectedInsight?.title}</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={styles.dialogText}>{selectedInsight?.description}</Text>
            {selectedInsight?.actionItems && selectedInsight.actionItems.length > 0 && (
              <>
                <Text variant="bodyMedium" style={styles.dialogSubtitle}>Suggested Actions:</Text>
                {selectedInsight.actionItems.map((item, index) => (
                  <Text key={index} variant="bodyMedium" style={styles.dialogListItem}>• {item}</Text>
                ))}
              </>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setSelectedInsight(null)}>Close</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Recommendation Detail Dialog */}
      <Portal>
        <Dialog visible={!!selectedRecommendation} onDismiss={() => setSelectedRecommendation(null)}>
          <Dialog.Title>{selectedRecommendation?.title}</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={styles.dialogText}>{selectedRecommendation?.description}</Text>
            <Text variant="bodyMedium" style={styles.dialogSubtitle}>Potential Impact:</Text>
            <Text variant="bodyMedium" style={styles.dialogText}>{selectedRecommendation?.potentialImpact}</Text>
            <Text variant="bodyMedium" style={styles.dialogSubtitle}>Difficulty:</Text>
            <Chip 
              style={[
                styles.difficultyChip, 
                { 
                  backgroundColor: 
                    selectedRecommendation?.difficulty === 'easy' ? 'rgba(46, 204, 113, 0.2)' : 
                    selectedRecommendation?.difficulty === 'medium' ? 'rgba(241, 196, 15, 0.2)' : 
                    'rgba(231, 76, 60, 0.2)' 
                }
              ]}
            >
              <Text style={[
                styles.difficultyText,
                {
                  color: 
                    selectedRecommendation?.difficulty === 'easy' ? 'rgb(46, 204, 113)' : 
                    selectedRecommendation?.difficulty === 'medium' ? 'rgb(241, 196, 15)' : 
                    'rgb(231, 76, 60)'
                }
              ]}>
                {selectedRecommendation?.difficulty}
              </Text>
            </Chip>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setSelectedRecommendation(null)}>Close</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
  },
  lastCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: 'bold',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  forecastSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  forecastItem: {
    flex: 1,
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 4,
    elevation: 1,
  },
  forecastLabel: {
    marginBottom: 4,
  },
  forecastValue: {
    fontWeight: 'bold',
  },
  riskContainer: {
    marginBottom: 16,
  },
  riskTitle: {
    marginBottom: 8,
  },
  riskLevel: {
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  riskProgressBar: {
    height: 8,
    borderRadius: 4,
  },
  riskFactorsTitle: {
    marginTop: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
  },
  chipText: {
    fontSize: 12,
  },
  chartContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  chart: {
    borderRadius: 16,
  },
  forecastLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 4,
  },
  legendText: {
    fontSize: 12,
  },
  chartNote: {
    textAlign: 'center',
    fontSize: 12,
    opacity: 0.6,
    marginTop: 8,
  },
  noDataText: {
    textAlign: 'center',
    marginVertical: 20,
    opacity: 0.6,
  },
  listItem: {
    paddingVertical: 8,
  },
  dialogText: {
    marginBottom: 16,
    lineHeight: 20,
  },
  dialogSubtitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  dialogListItem: {
    marginBottom: 8,
    paddingLeft: 8,
  },
  difficultyChip: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  difficultyText: {
    fontWeight: '500',
  },
});
