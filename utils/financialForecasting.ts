import { Transaction } from '@/types';
import { startOfMonth, endOfMonth, eachMonthOfInterval, subMonths, addMonths, format } from 'date-fns';

export interface MonthlyStats {
  month: string;
  income: number;
  expenses: number;
  balance: number;
  categories: {
    [key: string]: {
      amount: number;
      trend: number; // percentage change from previous month
    };
  };
}

export interface Forecast {
  predictedIncome: number;
  predictedExpenses: number;
  predictedBalance: number;
  riskLevel: string;
  recommendations: string[];
}

export interface FinancialInsight {
  type: 'success' | 'warning' | 'info' | 'danger';
  title: string;
  description: string;
  actionItems?: string[];
}

export interface SpendingPattern {
  category: string;
  trend: 'increasing' | 'decreasing' | 'stable';
  percentageChange: number;
  isUnusual: boolean;
  amount: number; // Add amount property for chart visualization
}

export interface RiskAssessment {
  level: 'low' | 'medium' | 'high';
  factors: string[];
  mitigationSteps: string[];
}

export interface AIRecommendation {
  category: 'saving' | 'spending' | 'investment' | 'debt';
  title: string;
  description: string;
  potentialImpact: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export function calculateMonthlyStats(transactions: Transaction[], startDate: Date, endDate: Date): MonthlyStats[] {
  const months = eachMonthOfInterval({ start: startDate, end: endDate });
  
  return months.map(month => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    
    const monthTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      return date >= monthStart && date <= monthEnd;
    });

    const stats: MonthlyStats = {
      month: format(month, 'yyyy-MM'),
      income: 0,
      expenses: 0,
      balance: 0,
      categories: {}
    };

    monthTransactions.forEach(t => {
      if (t.type === 'income') {
        stats.income += t.amount;
        stats.balance += t.amount;
      } else {
        stats.expenses += t.amount;
        stats.balance -= t.amount;
      }

      // Track category amounts
      if (!stats.categories[t.category_id]) {
        stats.categories[t.category_id] = { amount: 0, trend: 0 };
      }
      stats.categories[t.category_id].amount += t.type === 'income' ? t.amount : -t.amount;
    });

    return stats;
  });
}

export function generateForecast(monthlyStats: MonthlyStats[]): Forecast {
  // Need at least 2 months of data
  if (monthlyStats.length < 2) {
    return {
      predictedIncome: 0,
      predictedExpenses: 0,
      predictedBalance: 0,
      riskLevel: 'medium',
      recommendations: ['Not enough data for accurate forecast'],
    };
  }

  // Calculate average monthly change for income and expenses
  let incomeChangeSum = 0;
  let expensesChangeSum = 0;
  
  for (let i = 1; i < monthlyStats.length; i++) {
    const incomeChange = monthlyStats[i].income - monthlyStats[i-1].income;
    const expensesChange = monthlyStats[i].expenses - monthlyStats[i-1].expenses;
    
    incomeChangeSum += incomeChange;
    expensesChangeSum += expensesChange;
  }
  
  const avgIncomeChange = incomeChangeSum / (monthlyStats.length - 1);
  const avgExpensesChange = expensesChangeSum / (monthlyStats.length - 1);
  
  // Predict next month values
  const lastMonth = monthlyStats[monthlyStats.length - 1];
  const predictedIncome = Math.round(lastMonth.income + avgIncomeChange);
  const predictedExpenses = Math.round(lastMonth.expenses + avgExpensesChange);
  const predictedBalance = Math.round(predictedIncome - predictedExpenses);
  
  // Determine risk level
  let riskLevel = 'low';
  if (predictedBalance < 0) {
    riskLevel = 'high';
  } else if (predictedExpenses / predictedIncome > 0.8) {
    riskLevel = 'medium';
  }
  
  // Generate recommendations
  const recommendations = [];
  
  if (predictedBalance < 0) {
    recommendations.push('Reduce non-essential expenses to avoid negative balance');
  }
  
  if (predictedExpenses / predictedIncome > 0.8) {
    recommendations.push('Consider increasing income sources or reducing expenses');
  }
  
  if (avgExpensesChange > 0) {
    recommendations.push('Your expenses are trending upward, consider budgeting');
  }
  
  if (avgIncomeChange < 0) {
    recommendations.push('Your income is trending downward, explore additional income sources');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Continue your current financial habits');
  }
  
  return {
    predictedIncome,
    predictedExpenses,
    predictedBalance,
    riskLevel,
    recommendations,
  };
}

function calculateGrowthRate(values: number[]): number {
  if (values.length < 2) return 0;
  
  // Calculate average month-over-month growth
  let totalGrowth = 0;
  let validMonths = 0;
  
  for (let i = 1; i < values.length; i++) {
    if (values[i-1] !== 0) {
      totalGrowth += (values[i] - values[i-1]) / values[i-1];
      validMonths++;
    }
  }
  
  return validMonths > 0 ? totalGrowth / validMonths : 0;
}

function assessRiskLevel(
  predictedIncome: number,
  predictedExpenses: number,
  history: MonthlyStats[]
): 'low' | 'medium' | 'high' {
  const predictedSavingsRate = (predictedIncome - predictedExpenses) / predictedIncome;
  
  if (predictedSavingsRate < 0) return 'high';
  if (predictedSavingsRate < 0.2) return 'medium';
  return 'low';
}

function generateRecommendations(
  predictedIncome: number,
  predictedExpenses: number,
  riskLevel: 'low' | 'medium' | 'high',
  history: MonthlyStats[]
): string[] {
  const recommendations: string[] = [];
  const savingsRate = (predictedIncome - predictedExpenses) / predictedIncome;

  if (riskLevel === 'high') {
    recommendations.push('⚠️ Warning: Your expenses are projected to exceed your income.');
    recommendations.push('Consider reducing non-essential expenses or finding additional income sources.');
  }

  if (savingsRate < 0.2) {
    recommendations.push('Try to increase your savings rate to at least 20% of your income.');
  }

  if (predictedExpenses > predictedIncome * 0.8) {
    recommendations.push('Your expenses are taking up more than 80% of your income. Look for areas to cut back.');
  }

  // Add positive reinforcement for good financial habits
  if (savingsRate > 0.3) {
    recommendations.push('Great job! You\'re maintaining a healthy savings rate above 30%.');
  }

  return recommendations;
}

export function analyzeSpendingPatterns(transactions: Transaction[]): SpendingPattern[] {
  const patterns: SpendingPattern[] = [];
  const categories = [...new Set(transactions.map(t => t.category))];
  
  categories.forEach(category => {
    const categoryTransactions = transactions.filter(t => t.category === category);
    const recentTransactions = categoryTransactions.filter(t => 
      new Date(t.date) >= subMonths(new Date(), 1)
    );
    const olderTransactions = categoryTransactions.filter(t => 
      new Date(t.date) < subMonths(new Date(), 1) && 
      new Date(t.date) >= subMonths(new Date(), 2)
    );

    const recentTotal = recentTransactions.reduce((sum, t) => sum + t.amount, 0);
    const olderTotal = olderTransactions.reduce((sum, t) => sum + t.amount, 0);
    
    const percentageChange = olderTotal === 0 ? 100 : 
      ((recentTotal - olderTotal) / olderTotal) * 100;
    
    const trend: SpendingPattern['trend'] = 
      Math.abs(percentageChange) < 5 ? 'stable' :
      percentageChange > 0 ? 'increasing' : 'decreasing';

    patterns.push({
      category,
      trend,
      percentageChange: Math.round(percentageChange),
      isUnusual: Math.abs(percentageChange) > 30,
      amount: Math.round(recentTotal)
    });
  });

  return patterns;
}

export function generateFinancialInsights(
  transactions: Transaction[],
  monthlyStats: MonthlyStats,
  spendingPatterns: SpendingPattern[]
): FinancialInsight[] {
  const insights: FinancialInsight[] = [];
  
  // Analyze savings rate
  const savingsRate = (monthlyStats.income - monthlyStats.expenses) / monthlyStats.income * 100;
  if (savingsRate < 20) {
    insights.push({
      type: 'warning',
      title: 'Low Savings Rate',
      description: `Your current savings rate is ${Math.round(savingsRate)}%. Consider aiming for at least 20%.`,
      actionItems: [
        'Review non-essential expenses',
        'Set up automatic savings transfers',
        'Look for additional income opportunities'
      ]
    });
  }

  // Analyze unusual spending patterns
  const unusualPatterns = spendingPatterns.filter(p => p.isUnusual);
  if (unusualPatterns.length > 0) {
    unusualPatterns.forEach(pattern => {
      insights.push({
        type: 'info',
        title: `Unusual ${pattern.category} Spending`,
        description: `Your ${pattern.category} spending has ${pattern.trend} by ${Math.abs(pattern.percentageChange)}% compared to last month.`,
        actionItems: pattern.trend === 'increasing' ? [
          `Review recent ${pattern.category} expenses`,
          'Look for more cost-effective alternatives',
          'Set a budget for this category'
        ] : undefined
      });
    });
  }

  // Check for recurring high-value transactions
  const highValueTransactions = transactions
    .filter(t => t.amount > monthlyStats.income * 0.2)
    .slice(0, 3);

  if (highValueTransactions.length > 0) {
    insights.push({
      type: 'info',
      title: 'Large Transactions Detected',
      description: 'You have some significant expenses that might impact your budget.',
      actionItems: highValueTransactions.map(t => 
        `Review ${t.category} expense of $${t.amount} on ${format(new Date(t.date), 'MMM d')}`
      )
    });
  }

  return insights;
}

export function assessFinancialRisk(
  monthlyStats: MonthlyStats,
  spendingPatterns: SpendingPattern[]
): RiskAssessment {
  const factors: string[] = [];
  const mitigationSteps: string[] = [];
  let riskLevel: RiskAssessment['level'] = 'low';

  // Check expense to income ratio
  const expenseRatio = monthlyStats.expenses / monthlyStats.income;
  if (expenseRatio > 0.9) {
    factors.push('High expense to income ratio');
    mitigationSteps.push('Reduce non-essential expenses');
    riskLevel = 'high';
  } else if (expenseRatio > 0.7) {
    factors.push('Elevated expense to income ratio');
    mitigationSteps.push('Monitor spending in major categories');
    riskLevel = 'medium';
  }

  // Check for volatile spending patterns
  const volatileCategories = spendingPatterns.filter(p => p.isUnusual);
  if (volatileCategories.length >= 3) {
    factors.push('Multiple categories with unusual spending patterns');
    mitigationSteps.push('Review and stabilize spending across categories');
    riskLevel = 'high';
  } else if (volatileCategories.length > 0) {
    factors.push('Some categories show unusual spending patterns');
    mitigationSteps.push('Monitor categories with unusual spending');
    riskLevel = riskLevel === 'high' ? 'high' : 'medium';
  }

  // Check emergency fund ratio (assuming 3 months of expenses as target)
  const emergencyFundRatio = monthlyStats.savings / (monthlyStats.expenses * 3);
  if (emergencyFundRatio < 0.5) {
    factors.push('Insufficient emergency fund');
    mitigationSteps.push('Build emergency fund to cover 3 months of expenses');
    riskLevel = 'high';
  } else if (emergencyFundRatio < 1) {
    factors.push('Emergency fund below target');
    mitigationSteps.push('Continue building emergency fund');
    riskLevel = riskLevel === 'high' ? 'high' : 'medium';
  }

  return { level: riskLevel, factors, mitigationSteps };
}

export function generateAIRecommendations(
  monthlyStats: MonthlyStats,
  spendingPatterns: SpendingPattern[],
  riskAssessment: RiskAssessment
): AIRecommendation[] {
  const recommendations: AIRecommendation[] = [];

  // Savings recommendations
  const savingsRate = (monthlyStats.income - monthlyStats.expenses) / monthlyStats.income;
  if (savingsRate < 0.2) {
    recommendations.push({
      category: 'saving',
      title: 'Boost Your Savings Rate',
      description: 'Set up automatic transfers to savings on payday',
      potentialImpact: 'Increase savings rate by 5-10%',
      difficulty: 'easy'
    });
  }

  // Spending optimization
  const increasingCategories = spendingPatterns.filter(p => p.trend === 'increasing');
  if (increasingCategories.length > 0) {
    recommendations.push({
      category: 'spending',
      title: 'Optimize High-Growth Categories',
      description: `Review spending in ${increasingCategories.map(c => c.category).join(', ')}`,
      potentialImpact: 'Reduce monthly expenses by 10-15%',
      difficulty: 'medium'
    });
  }

  // Investment suggestions based on savings
  if (monthlyStats.savings > monthlyStats.expenses * 6) {
    recommendations.push({
      category: 'investment',
      title: 'Consider Investment Options',
      description: 'Explore diversifying excess savings into investments',
      potentialImpact: 'Potential 5-8% annual returns on investments',
      difficulty: 'hard'
    });
  }

  // Debt management
  if (monthlyStats.debt > monthlyStats.income * 0.5) {
    recommendations.push({
      category: 'debt',
      title: 'Debt Reduction Strategy',
      description: 'Implement debt snowball or avalanche method',
      potentialImpact: 'Reduce interest payments by 20-30%',
      difficulty: 'medium'
    });
  }

  return recommendations;
}

export function generateMonthlyForecast(monthlyStats: MonthlyStats[], months: number = 6): Array<{month: string, income: number, expenses: number, balance: number}> {
  // Need at least 2 months of data
  if (monthlyStats.length < 2) {
    return Array(months).fill(null).map((_, i) => {
      const date = addMonths(new Date(), i + 1);
      return {
        month: format(date, 'MMM'),
        income: 0,
        expenses: 0,
        balance: 0
      };
    });
  }

  // Calculate average monthly change for income and expenses
  let incomeChangeSum = 0;
  let expensesChangeSum = 0;
  
  for (let i = 1; i < monthlyStats.length; i++) {
    const incomeChange = monthlyStats[i].income - monthlyStats[i-1].income;
    const expensesChange = monthlyStats[i].expenses - monthlyStats[i-1].expenses;
    
    incomeChangeSum += incomeChange;
    expensesChangeSum += expensesChange;
  }
  
  const avgIncomeChange = incomeChangeSum / (monthlyStats.length - 1);
  const avgExpensesChange = expensesChangeSum / (monthlyStats.length - 1);
  
  // Predict future months
  const lastMonth = monthlyStats[monthlyStats.length - 1];
  const forecastData = [];

  for (let i = 1; i <= months; i++) {
    const date = addMonths(new Date(), i);
    const predictedIncome = Math.round(lastMonth.income + (avgIncomeChange * i));
    const predictedExpenses = Math.round(lastMonth.expenses + (avgExpensesChange * i));
    const predictedBalance = predictedIncome - predictedExpenses;

    forecastData.push({
      month: format(date, 'MMM'),
      income: predictedIncome,
      expenses: predictedExpenses,
      balance: predictedBalance
    });
  }

  return forecastData;
}
