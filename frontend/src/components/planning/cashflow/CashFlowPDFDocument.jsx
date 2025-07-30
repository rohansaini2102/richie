import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
  PDFViewer,
  PDFDownloadLink,
  BlobProvider,
  pdf
} from '@react-pdf/renderer';

// Register fonts for better typography
Font.register({
  family: 'Roboto',
  fonts: [
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf',
      fontWeight: 300,
    },
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf',
      fontWeight: 400,
    },
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-medium-webfont.ttf',
      fontWeight: 500,
    },
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf',
      fontWeight: 700,
    },
    // Add italic variants - using oblique as fallback since Roboto doesn't have true italics at this CDN
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf',
      fontWeight: 400,
      fontStyle: 'italic',
    },
  ],
});

// Define styles
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Roboto',
    fontSize: 11,
    paddingTop: 35,
    paddingBottom: 65,
    paddingHorizontal: 35,
    backgroundColor: '#FFFFFF',
  },
  header: {
    marginBottom: 20,
    borderBottom: '2 solid #0066CC',
    paddingBottom: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  firmName: {
    fontSize: 16,
    fontWeight: 700,
    color: '#003366',
  },
  advisorInfo: {
    fontSize: 10,
    color: '#666666',
    marginTop: 2,
  },
  pageNumber: {
    fontSize: 10,
    color: '#666666',
    textAlign: 'right',
  },
  date: {
    fontSize: 10,
    color: '#666666',
    textAlign: 'right',
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    color: '#003366',
    textAlign: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#003366',
    textAlign: 'center',
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: '#003366',
    marginTop: 30,
    marginBottom: 15,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: 500,
    color: '#003366',
    marginTop: 20,
    marginBottom: 10,
  },
  text: {
    fontSize: 11,
    lineHeight: 1.6,
    marginBottom: 8,
    textAlign: 'justify',
  },
  table: {
    display: 'table',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRightWidth: 0,
    borderBottomWidth: 0,
    marginTop: 10,
    marginBottom: 20,
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableRowHeader: {
    backgroundColor: '#0066CC',
  },
  tableRowAlternate: {
    backgroundColor: '#F9FAFB',
  },
  tableCol: {
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 8,
  },
  tableCell: {
    fontSize: 10,
    lineHeight: 1.4,
  },
  tableCellHeader: {
    fontSize: 11,
    fontWeight: 700,
    color: '#FFFFFF',
  },
  infoBox: {
    backgroundColor: '#F0F8FF',
    border: '1 solid #0066CC',
    borderRadius: 5,
    padding: 15,
    marginVertical: 15,
  },
  infoBoxTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: '#003366',
    marginBottom: 10,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginVertical: 15,
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#F9FAFB',
    border: '1 solid #E5E7EB',
    borderRadius: 5,
    padding: 12,
    marginBottom: 10,
  },
  metricLabel: {
    fontSize: 10,
    color: '#666666',
    marginBottom: 5,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 700,
    color: '#003366',
  },
  metricSubtext: {
    fontSize: 9,
    color: '#666666',
    marginTop: 3,
  },
  bulletList: {
    marginLeft: 20,
    marginVertical: 10,
  },
  bulletItem: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  bullet: {
    fontSize: 11,
    marginRight: 10,
  },
  bulletText: {
    fontSize: 11,
    flex: 1,
    lineHeight: 1.6,
  },
  footer: {
    position: 'absolute',
    fontSize: 9,
    bottom: 30,
    left: 35,
    right: 35,
    textAlign: 'center',
    color: '#666666',
  },
  disclaimer: {
    fontSize: 9,
    color: '#666666',
    marginTop: 30,
    padding: 10,
    backgroundColor: '#F9FAFB',
    borderRadius: 5,
  },
  pageBreak: {
    breakBefore: 'page',
  },
  // Status colors
  successText: {
    color: '#059669',
  },
  warningText: {
    color: '#D97706',
  },
  errorText: {
    color: '#DC2626',
  },
});

// Utility functions
const formatCurrency = (amount) => {
  if (!amount || amount === 0) return '₹0';
  return `₹${new Intl.NumberFormat('en-IN').format(amount)}`;
};

const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return 'N/A';
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

// Header Component
const Header = ({ advisorData, pageNumber }) => (
  <View style={styles.header}>
    <View style={styles.headerTop}>
      <View>
        <Text style={styles.firmName}>{advisorData?.firmName || 'Financial Advisory Services'}</Text>
        <Text style={styles.advisorInfo}>
          {advisorData?.firstName} {advisorData?.lastName}
          {advisorData?.sebiRegNumber ? ` | SEBI Reg: ${advisorData.sebiRegNumber}` : ''}
        </Text>
      </View>
      <View>
        <Text style={styles.pageNumber}>Page {pageNumber}</Text>
        <Text style={styles.date}>{new Date().toLocaleDateString('en-IN')}</Text>
      </View>
    </View>
  </View>
);

// Table Component with better layout
const Table = ({ headers, data, columnWidths }) => {
  const defaultWidth = 100 / headers.length;
  const widths = columnWidths || headers.map(() => `${defaultWidth}%`);

  return (
    <View style={styles.table}>
      {/* Header Row */}
      <View style={[styles.tableRow, styles.tableRowHeader]}>
        {headers.map((header, index) => (
          <View key={index} style={[styles.tableCol, { width: widths[index] }]}>
            <Text style={[styles.tableCell, styles.tableCellHeader]} numberOfLines={2}>{header}</Text>
          </View>
        ))}
      </View>
      {/* Data Rows */}
      {data.map((row, rowIndex) => (
        <View
          key={rowIndex}
          style={[
            styles.tableRow,
            rowIndex % 2 === 0 ? styles.tableRowAlternate : {},
          ]}
        >
          {row.map((cell, cellIndex) => (
            <View key={cellIndex} style={[styles.tableCol, { width: widths[cellIndex] }]}>
              <Text style={[styles.tableCell, { 
                fontSize: cell.toString().length > 20 ? 9 : 10,
                textAlign: cellIndex > 1 && cellIndex < headers.length - 1 ? 'right' : 'left'
              }]} numberOfLines={2}>{cell}</Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
};

// Main PDF Document Component
const CashFlowPDFDocument = ({ clientData, planData, metrics, aiRecommendations, cacheInfo, advisorData }) => {
  // Calculate key metrics
  const monthlyIncome = clientData?.totalMonthlyIncome || 0;
  const monthlyExpenses = clientData?.totalMonthlyExpenses || 0;
  const monthlySurplus = monthlyIncome - monthlyExpenses;
  const savingsRate = monthlyIncome > 0 ? ((monthlySurplus / monthlyIncome) * 100).toFixed(1) : 0;

  return (
    <Document>
      {/* Cover Page */}
      <Page size="A4" style={styles.page}>
        <Header advisorData={advisorData} pageNumber={1} />
        
        <Text style={styles.title}>CASH FLOW ANALYSIS REPORT</Text>
        <Text style={styles.subtitle}>Comprehensive Financial Cash Flow Planning</Text>
        
        <View style={styles.infoBox}>
          <Text style={styles.infoBoxTitle}>CLIENT INFORMATION</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.text}>Name: {clientData?.firstName} {clientData?.lastName}</Text>
              <Text style={styles.text}>Age: {calculateAge(clientData?.dateOfBirth)} years</Text>
              <Text style={styles.text}>PAN: {clientData?.panCard || 'Not Provided'}</Text>
              <Text style={styles.text}>Email: {clientData?.email || 'Not Provided'}</Text>
              <Text style={styles.text}>Phone: {clientData?.phoneNumber || clientData?.contactNumber || 'Not Provided'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.text}>Occupation: {clientData?.occupation || 'Not Specified'}</Text>
              <Text style={styles.text}>Employment Type: {clientData?.employmentType || 'Salaried'}</Text>
              <Text style={styles.text}>Risk Profile: {clientData?.riskTolerance || 'Moderate'}</Text>
              <Text style={styles.text}>Monthly Income: {formatCurrency(monthlyIncome)}</Text>
              <Text style={styles.text}>Annual Income: {formatCurrency(clientData?.annualIncome || monthlyIncome * 12)}</Text>
            </View>
          </View>
        </View>
        
        {/* Advisor Information Box */}
        <View style={[styles.infoBox, { marginTop: 20 }]}>
          <Text style={styles.infoBoxTitle}>PREPARED BY</Text>
          <Text style={styles.text}>Advisor: {advisorData?.firstName} {advisorData?.lastName}</Text>
          <Text style={styles.text}>Firm: {advisorData?.firmName || 'Financial Advisory Services'}</Text>
          {advisorData?.sebiRegNumber && (
            <Text style={styles.text}>SEBI Registration: {advisorData.sebiRegNumber}</Text>
          )}
          {advisorData?.email && (
            <Text style={styles.text}>Email: {advisorData.email}</Text>
          )}
          {advisorData?.phoneNumber && (
            <Text style={styles.text}>Phone: {advisorData.phoneNumber}</Text>
          )}
        </View>
        
        <Text style={[styles.text, { marginTop: 20 }]}>
          Report Generated: {new Date().toLocaleDateString('en-IN')}
        </Text>
        <Text style={styles.text}>Plan Type: Cash Flow Analysis</Text>
      </Page>

      {/* Executive Summary */}
      <Page size="A4" style={styles.page}>
        <Header advisorData={advisorData} pageNumber={2} />
        
        <Text style={styles.sectionTitle}>EXECUTIVE SUMMARY</Text>
        
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Monthly Income</Text>
            <Text style={styles.metricValue}>{formatCurrency(monthlyIncome)}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Monthly Expenses</Text>
            <Text style={styles.metricValue}>{formatCurrency(monthlyExpenses)}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Monthly Surplus/Deficit</Text>
            <Text style={[styles.metricValue, monthlySurplus >= 0 ? styles.successText : styles.errorText]}>
              {formatCurrency(monthlySurplus)}
            </Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Savings Rate</Text>
            <Text style={styles.metricValue}>{savingsRate}%</Text>
            <Text style={styles.metricSubtext}>
              {savingsRate >= 20 ? 'Excellent' : savingsRate >= 10 ? 'Good' : 'Needs Improvement'}
            </Text>
          </View>
        </View>
        
        <Text style={styles.subsectionTitle}>CASH FLOW ANALYSIS</Text>
        <Text style={styles.text}>
          {monthlySurplus > 0 
            ? `Your current cash flow shows a positive surplus of ${formatCurrency(monthlySurplus)} per month, representing a ${savingsRate}% savings rate.`
            : `Your current expenses exceed your income by ${formatCurrency(Math.abs(monthlySurplus))} per month. This negative cash flow requires immediate attention.`
          }
        </Text>
      </Page>

      {/* Financial Metrics Dashboard */}
      <Page size="A4" style={styles.page}>
        <Header advisorData={advisorData} pageNumber={3} />
        
        <Text style={styles.sectionTitle}>FINANCIAL METRICS DASHBOARD</Text>
        
        {/* Key Ratios */}
        <Text style={styles.subsectionTitle}>KEY FINANCIAL RATIOS</Text>
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Savings Rate</Text>
            <Text style={[styles.metricValue, savingsRate >= 20 ? styles.successText : savingsRate >= 10 ? styles.warningText : styles.errorText]}>
              {savingsRate}%
            </Text>
            <Text style={styles.metricSubtext}>
              {savingsRate >= 20 ? 'Excellent' : savingsRate >= 10 ? 'Good' : 'Needs Improvement'}
            </Text>
          </View>
          
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Expense Ratio</Text>
            <Text style={[styles.metricValue, (monthlyExpenses/monthlyIncome*100) > 80 ? styles.errorText : styles.successText]}>
              {monthlyIncome > 0 ? ((monthlyExpenses/monthlyIncome)*100).toFixed(1) : 0}%
            </Text>
            <Text style={styles.metricSubtext}>of Income</Text>
          </View>
          
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>EMI to Income</Text>
            <Text style={[styles.metricValue, 
              ((planData?.debtManagement?.prioritizedDebts?.reduce((sum, debt) => sum + (debt.emi || 0), 0) || 0) / monthlyIncome * 100) > 40 
                ? styles.errorText : styles.successText]}>
              {monthlyIncome > 0 
                ? ((planData?.debtManagement?.prioritizedDebts?.reduce((sum, debt) => sum + (debt.emi || 0), 0) || 0) / monthlyIncome * 100).toFixed(1) 
                : 0}%
            </Text>
            <Text style={styles.metricSubtext}>
              {((planData?.debtManagement?.prioritizedDebts?.reduce((sum, debt) => sum + (debt.emi || 0), 0) || 0) / monthlyIncome * 100) > 40 
                ? 'Above Safe Limit' : 'Within Safe Limit'}
            </Text>
          </View>
          
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Debt to Income</Text>
            <Text style={styles.metricValue}>
              {(clientData?.annualIncome || monthlyIncome * 12) > 0 
                ? ((planData?.debtManagement?.prioritizedDebts?.reduce((sum, debt) => sum + (debt.outstandingAmount || 0), 0) || 0) / 
                   (clientData?.annualIncome || monthlyIncome * 12)).toFixed(1) 
                : 0}x
            </Text>
            <Text style={styles.metricSubtext}>Annual Income</Text>
          </View>
        </View>
        
        {/* Monthly Cash Flow Breakdown */}
        <Text style={styles.subsectionTitle}>MONTHLY CASH FLOW BREAKDOWN</Text>
        <Table
          headers={['Category', 'Amount', '% of Income']}
          data={[
            ['Total Income', formatCurrency(monthlyIncome), '100%'],
            ['Fixed Expenses', formatCurrency(monthlyExpenses * 0.7), `${(monthlyExpenses * 0.7 / monthlyIncome * 100).toFixed(1)}%`],
            ['Variable Expenses', formatCurrency(monthlyExpenses * 0.3), `${(monthlyExpenses * 0.3 / monthlyIncome * 100).toFixed(1)}%`],
            ['Total EMIs', formatCurrency(planData?.debtManagement?.prioritizedDebts?.reduce((sum, debt) => sum + (debt.emi || 0), 0) || 0), 
              `${((planData?.debtManagement?.prioritizedDebts?.reduce((sum, debt) => sum + (debt.emi || 0), 0) || 0) / monthlyIncome * 100).toFixed(1)}%`],
            ['Available for Savings', formatCurrency(monthlySurplus), `${savingsRate}%`],
          ]}
          columnWidths={['40%', '30%', '30%']}
        />
        
        {/* Financial Health Assessment */}
        <Text style={styles.subsectionTitle}>FINANCIAL HEALTH ASSESSMENT</Text>
        <View style={[styles.infoBox, { backgroundColor: monthlySurplus > 0 ? '#F0FDF4' : '#FEF2F2' }]}>
          <Text style={[styles.text, { fontWeight: 'bold' }]}>
            Overall Status: {monthlySurplus > 0 ? '✅ Positive Cash Flow' : '❌ Negative Cash Flow'}
          </Text>
          <Text style={styles.text}>
            {monthlySurplus > 0 
              ? `You have a monthly surplus of ${formatCurrency(monthlySurplus)} available for savings and investments.`
              : `You have a monthly deficit of ${formatCurrency(Math.abs(monthlySurplus))}. Immediate action is required to balance your budget.`
            }
          </Text>
        </View>
      </Page>

      {/* Income Analysis */}
      <Page size="A4" style={styles.page}>
        <Header advisorData={advisorData} pageNumber={4} />
        
        <Text style={styles.sectionTitle}>INCOME ANALYSIS</Text>
        
        {clientData && (
          <Table
            headers={['Income Source', 'Monthly Amount']}
            data={[
              ...(clientData.primaryEmploymentIncome ? [['Primary Employment', formatCurrency(clientData.primaryEmploymentIncome)]] : []),
              ...(clientData.secondaryEmploymentIncome ? [['Secondary Employment', formatCurrency(clientData.secondaryEmploymentIncome)]] : []),
              ...(clientData.rentalIncome ? [['Rental Income', formatCurrency(clientData.rentalIncome)]] : []),
              ...(clientData.otherIncome ? [['Other Income', formatCurrency(clientData.otherIncome)]] : []),
              [['Total Monthly Income', formatCurrency(monthlyIncome)]],
            ]}
            columnWidths={['70%', '30%']}
          />
        )}
        
        <Text style={styles.subsectionTitle}>ANNUAL INCOME PROJECTION</Text>
        <Text style={styles.text}>
          Based on current monthly income, your projected annual income is {formatCurrency(monthlyIncome * 12)}.
        </Text>
      </Page>

      {/* Expense Analysis */}
      <Page size="A4" style={styles.page}>
        <Header advisorData={advisorData} pageNumber={5} />
        
        <Text style={styles.sectionTitle}>EXPENSE ANALYSIS</Text>
        
        {clientData && (
          <Table
            headers={['Expense Category', 'Monthly Amount']}
            data={[
              ...(clientData.housing ? [['Housing (Rent/EMI)', formatCurrency(clientData.housing)]] : []),
              ...(clientData.utilities ? [['Utilities', formatCurrency(clientData.utilities)]] : []),
              ...(clientData.transportation ? [['Transportation', formatCurrency(clientData.transportation)]] : []),
              ...(clientData.groceries ? [['Groceries', formatCurrency(clientData.groceries)]] : []),
              ...(clientData.healthcare ? [['Healthcare', formatCurrency(clientData.healthcare)]] : []),
              ...(clientData.insurance ? [['Insurance', formatCurrency(clientData.insurance)]] : []),
              ...(clientData.education ? [['Education', formatCurrency(clientData.education)]] : []),
              ...(clientData.entertainment ? [['Entertainment', formatCurrency(clientData.entertainment)]] : []),
              ...(clientData.personalCare ? [['Personal Care', formatCurrency(clientData.personalCare)]] : []),
              ...(clientData.otherExpenses ? [['Other Expenses', formatCurrency(clientData.otherExpenses)]] : []),
              [['Total Monthly Expenses', formatCurrency(monthlyExpenses)]],
            ]}
            columnWidths={['70%', '30%']}
          />
        )}
        
        {monthlyExpenses > 0 && monthlyIncome > 0 && (
          <>
            <Text style={styles.subsectionTitle}>EXPENSE RATIO ANALYSIS</Text>
            <Text style={styles.text}>
              Your expenses represent {((monthlyExpenses / monthlyIncome) * 100).toFixed(1)}% of your monthly income.
            </Text>
          </>
        )}
      </Page>

      {/* Cash Flow Statement */}
      <Page size="A4" style={styles.page}>
        <Header advisorData={advisorData} pageNumber={6} />
        
        <Text style={styles.sectionTitle}>CASH FLOW STATEMENT</Text>
        
        <Table
          headers={['Description', 'Amount']}
          data={[
            ['Total Monthly Income', formatCurrency(monthlyIncome)],
            ['Total Monthly Expenses', formatCurrency(monthlyExpenses)],
            ['', ''],
            ['Net Cash Flow (Surplus/Deficit)', formatCurrency(monthlySurplus)],
          ]}
          columnWidths={['70%', '30%']}
        />
        
        <Text style={styles.subsectionTitle}>ANNUAL CASH FLOW PROJECTION</Text>
        
        <Table
          headers={['Description', 'Annual Amount']}
          data={[
            ['Annual Income', formatCurrency(monthlyIncome * 12)],
            ['Annual Expenses', formatCurrency(monthlyExpenses * 12)],
            ['Annual Surplus/Deficit', formatCurrency(monthlySurplus * 12)],
          ]}
          columnWidths={['70%', '30%']}
        />
      </Page>

      {/* Debt Management Plan (if applicable) */}
      {planData?.debtManagement?.prioritizedDebts?.length > 0 && (
        <Page size="A4" style={styles.page}>
          <Header advisorData={advisorData} pageNumber={7} />
          
          <Text style={styles.sectionTitle}>DEBT MANAGEMENT PLAN</Text>
          
          <Text style={styles.subsectionTitle}>CURRENT DEBT ANALYSIS</Text>
          
          <Table
            headers={['#', 'Debt Name', 'Outstanding', 'Interest', 'EMI', 'Priority']}
            data={planData.debtManagement.prioritizedDebts.map((debt, index) => [
              `${index + 1}`,
              debt.name || 'Unnamed Debt',
              formatCurrency(debt.outstandingAmount || 0),
              `${debt.interestRate || 0}%`,
              formatCurrency(debt.emi || 0),
              debt.priority || 'Medium',
            ])}
            columnWidths={['8%', '30%', '20%', '12%', '18%', '12%']}
          />
          
          <View style={[styles.metricsGrid, { marginTop: 20 }]}>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Total Outstanding Debt</Text>
              <Text style={styles.metricValue}>
                {formatCurrency(planData.debtManagement.totalDebt || 0)}
              </Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Total Monthly EMI</Text>
              <Text style={[styles.metricValue, 
                (planData.debtManagement.totalEMI / (clientData?.totalMonthlyIncome || 1) * 100) > 40 
                  ? styles.errorText : styles.successText]}>
                {formatCurrency(planData.debtManagement.totalEMI || 0)}
              </Text>
              <Text style={styles.metricSubtext}>
                {((planData.debtManagement.totalEMI / (clientData?.totalMonthlyIncome || 1)) * 100).toFixed(1)}% of Income
              </Text>
            </View>
          </View>
          
          {planData.debtManagement.strategy && (
            <>
              <Text style={styles.subsectionTitle}>REPAYMENT STRATEGY</Text>
              <Text style={styles.text}>{planData.debtManagement.strategy}</Text>
            </>
          )}
        </Page>
      )}

      {/* Emergency Fund Strategy */}
      {planData?.emergencyFundStrategy && (
        <Page size="A4" style={styles.page}>
          <Header advisorData={advisorData} pageNumber={8} />
          
          <Text style={styles.sectionTitle}>EMERGENCY FUND STRATEGY</Text>
          
          <Text style={styles.subsectionTitle}>CURRENT STATUS</Text>
          
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Current Emergency Fund</Text>
              <Text style={styles.metricValue}>
                {formatCurrency(planData.emergencyFundStrategy.currentAmount || 0)}
              </Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Target Emergency Fund</Text>
              <Text style={styles.metricValue}>
                {formatCurrency(planData.emergencyFundStrategy.targetAmount || 0)}
              </Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Coverage (Months)</Text>
              <Text style={styles.metricValue}>
                {planData.emergencyFundStrategy.monthsCovered || 0} months
              </Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Monthly Contribution</Text>
              <Text style={styles.metricValue}>
                {formatCurrency(planData.emergencyFundStrategy.monthlyContribution || 0)}
              </Text>
            </View>
          </View>
          
          {planData.emergencyFundStrategy.strategy && (
            <>
              <Text style={styles.subsectionTitle}>BUILDING STRATEGY</Text>
              <Text style={styles.text}>{planData.emergencyFundStrategy.strategy}</Text>
            </>
          )}
        </Page>
      )}

      {/* Investment Recommendations */}
      {planData?.investmentRecommendations?.monthlyInvestments?.length > 0 && (
        <Page size="A4" style={styles.page}>
          <Header advisorData={advisorData} pageNumber={9} />
          
          <Text style={styles.sectionTitle}>INVESTMENT RECOMMENDATIONS</Text>
          
          <Text style={styles.subsectionTitle}>RECOMMENDED MONTHLY INVESTMENTS</Text>
          
          <Table
            headers={['Fund Name', 'Category', 'Monthly Amount', 'Purpose']}
            data={[
              ...planData.investmentRecommendations.monthlyInvestments.map(inv => [
                inv.fundName || 'Investment Fund',
                inv.category || 'Diversified',
                formatCurrency(inv.amount || 0),
                inv.purpose || 'Wealth Creation',
              ]),
              [
                'Total Monthly Investment',
                '',
                formatCurrency(
                  planData.investmentRecommendations.monthlyInvestments.reduce(
                    (sum, inv) => sum + (inv.amount || 0),
                    0
                  )
                ),
                '',
              ],
            ]}
            columnWidths={['30%', '25%', '25%', '20%']}
          />
        </Page>
      )}

      {/* AI Recommendations - Enhanced */}
      {aiRecommendations && (
        <Page size="A4" style={styles.page}>
          <Header advisorData={advisorData} pageNumber={10} />
          
          <Text style={styles.sectionTitle}>AI-POWERED ANALYSIS & RECOMMENDATIONS</Text>
          
          {/* Financial Metrics from AI */}
          {aiRecommendations.financialMetrics && Object.keys(aiRecommendations.financialMetrics).length > 0 && (
            <>
              <Text style={styles.subsectionTitle}>KEY FINANCIAL METRICS</Text>
              <View style={styles.metricsGrid}>
                {aiRecommendations.financialMetrics.currentEMIRatio !== undefined && (
                  <View style={styles.metricCard}>
                    <Text style={styles.metricLabel}>EMI to Income Ratio</Text>
                    <Text style={[styles.metricValue, 
                      aiRecommendations.financialMetrics.currentEMIRatio > 40 ? styles.errorText : styles.successText]}>
                      {aiRecommendations.financialMetrics.currentEMIRatio}%
                    </Text>
                    <Text style={styles.metricSubtext}>
                      {aiRecommendations.financialMetrics.currentEMIRatio > 40 ? 'Above Safe Limit' : 'Within Safe Limit'}
                    </Text>
                  </View>
                )}
                {aiRecommendations.financialMetrics.totalInterestSavings !== undefined && (
                  <View style={styles.metricCard}>
                    <Text style={styles.metricLabel}>Potential Interest Savings</Text>
                    <Text style={[styles.metricValue, styles.successText]}>
                      {formatCurrency(aiRecommendations.financialMetrics.totalInterestSavings)}
                    </Text>
                  </View>
                )}
                {aiRecommendations.financialMetrics.financialHealthScore !== undefined && (
                  <View style={styles.metricCard}>
                    <Text style={styles.metricLabel}>Financial Health Score</Text>
                    <Text style={styles.metricValue}>
                      {aiRecommendations.financialMetrics.financialHealthScore}/100
                    </Text>
                  </View>
                )}
                {aiRecommendations.financialMetrics.monthlyInvestmentCapacity !== undefined && (
                  <View style={styles.metricCard}>
                    <Text style={styles.metricLabel}>Investment Capacity</Text>
                    <Text style={styles.metricValue}>
                      {formatCurrency(aiRecommendations.financialMetrics.monthlyInvestmentCapacity)}
                    </Text>
                  </View>
                )}
              </View>
            </>
          )}
          
          {/* Debt Strategy from AI */}
          {aiRecommendations.debtStrategy && (
            <>
              <Text style={styles.subsectionTitle}>DEBT MANAGEMENT STRATEGY</Text>
              <Text style={styles.text}>
                {aiRecommendations.debtStrategy.overallStrategy || aiRecommendations.debtStrategy.strategy}
              </Text>
              {aiRecommendations.debtStrategy.prioritizedDebts?.length > 0 && (
                <View style={{ marginTop: 10 }}>
                  {aiRecommendations.debtStrategy.prioritizedDebts.slice(0, 3).map((debt, index) => (
                    <View key={index} style={[styles.infoBox, { marginBottom: 5, padding: 8 }]}>
                      <Text style={{ fontWeight: 'bold', fontSize: 10 }}>
                        Priority {debt.priorityRank}: {debt.debtType}
                      </Text>
                      <Text style={{ fontSize: 9 }}>
                        Current EMI: {formatCurrency(debt.currentEMI)} → Recommended: {formatCurrency(debt.recommendedEMI)}
                      </Text>
                      <Text style={{ fontSize: 9 }}>{debt.reasoning}</Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
          
          {/* Warnings */}
          {aiRecommendations.warnings && aiRecommendations.warnings.length > 0 && (
            <>
              <Text style={[styles.subsectionTitle, { color: '#DC2626' }]}>⚠️ CRITICAL WARNINGS</Text>
              <View style={styles.bulletList}>
                {aiRecommendations.warnings.map((warning, index) => (
                  <View key={index} style={styles.bulletItem}>
                    <Text style={[styles.bullet, { color: '#DC2626' }]}>•</Text>
                    <Text style={[styles.bulletText, { color: '#DC2626' }]}>{warning}</Text>
                  </View>
                ))}
              </View>
            </>
          )}
          
          {/* Opportunities */}
          {aiRecommendations.opportunities && aiRecommendations.opportunities.length > 0 && (
            <>
              <Text style={[styles.subsectionTitle, { color: '#059669' }]}>💡 OPPORTUNITIES</Text>
              <View style={styles.bulletList}>
                {aiRecommendations.opportunities.map((opportunity, index) => (
                  <View key={index} style={styles.bulletItem}>
                    <Text style={[styles.bullet, { color: '#059669' }]}>•</Text>
                    <Text style={styles.bulletText}>{opportunity}</Text>
                  </View>
                ))}
              </View>
            </>
          )}
          
          {/* Recommendations */}
          {aiRecommendations.recommendations && (
            <>
              {aiRecommendations.recommendations.immediateActions?.length > 0 && (
                <>
                  <Text style={styles.subsectionTitle}>IMMEDIATE ACTION ITEMS (0-1 Month)</Text>
                  <View style={styles.bulletList}>
                    {aiRecommendations.recommendations.immediateActions.map((action, index) => (
                      <View key={index} style={styles.bulletItem}>
                        <Text style={styles.bullet}>•</Text>
                        <Text style={styles.bulletText}>{action}</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}
              
              {aiRecommendations.recommendations.mediumTermActions?.length > 0 && (
                <>
                  <Text style={styles.subsectionTitle}>MEDIUM-TERM ACTIONS (1-6 Months)</Text>
                  <View style={styles.bulletList}>
                    {aiRecommendations.recommendations.mediumTermActions.map((action, index) => (
                      <View key={index} style={styles.bulletItem}>
                        <Text style={styles.bullet}>•</Text>
                        <Text style={styles.bulletText}>{action}</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}
              
              {aiRecommendations.recommendations.longTermActions?.length > 0 && (
                <>
                  <Text style={styles.subsectionTitle}>LONG-TERM STRATEGY (6+ Months)</Text>
                  <View style={styles.bulletList}>
                    {aiRecommendations.recommendations.longTermActions.map((action, index) => (
                      <View key={index} style={styles.bulletItem}>
                        <Text style={styles.bullet}>•</Text>
                        <Text style={styles.bulletText}>{action}</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}
            </>
          )}
          
          {/* Legacy format support */}
          {aiRecommendations.cashFlowOptimization && (
            <>
              <Text style={styles.subsectionTitle}>CASH FLOW OPTIMIZATION</Text>
              <Text style={styles.text}>{aiRecommendations.cashFlowOptimization}</Text>
            </>
          )}
          
          {aiRecommendations.immediateActions?.length > 0 && (
            <>
              <Text style={styles.subsectionTitle}>IMMEDIATE ACTION ITEMS</Text>
              <View style={styles.bulletList}>
                {aiRecommendations.immediateActions.map((action, index) => (
                  <View key={index} style={styles.bulletItem}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.bulletText}>{action}</Text>
                  </View>
                ))}
              </View>
            </>
          )}
          
          {aiRecommendations.longTermRecommendations?.length > 0 && (
            <>
              <Text style={styles.subsectionTitle}>LONG-TERM RECOMMENDATIONS</Text>
              <View style={styles.bulletList}>
                {aiRecommendations.longTermRecommendations.map((recommendation, index) => (
                  <View key={index} style={styles.bulletItem}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.bulletText}>{recommendation}</Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </Page>
      )}

      {/* Advisor's Professional Analysis */}
      <Page size="A4" style={styles.page}>
        <Header advisorData={advisorData} pageNumber={11} />
        
        <Text style={styles.sectionTitle}>ADVISOR'S PROFESSIONAL ANALYSIS</Text>
        
        <View style={styles.infoBox}>
          <Text style={styles.subsectionTitle}>KEY OBSERVATIONS</Text>
          <View style={styles.bulletList}>
            <View style={styles.bulletItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>
                Cash Flow Status: Your {monthlySurplus >= 0 ? 'positive' : 'negative'} cash flow of {formatCurrency(Math.abs(monthlySurplus))} 
                {monthlySurplus >= 0 ? ' provides opportunities for wealth creation' : ' requires immediate attention'}.
              </Text>
            </View>
            <View style={styles.bulletItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>
                Savings Rate: At {savingsRate}%, your savings rate is {savingsRate >= 20 ? 'excellent and well-positioned' : savingsRate >= 10 ? 'good but has room for improvement' : 'below recommended levels'} for long-term financial security.
              </Text>
            </View>
            {planData?.debtManagement?.prioritizedDebts?.length > 0 && (
              <View style={styles.bulletItem}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.bulletText}>
                  Debt Management: Your total debt obligations require strategic management to optimize interest costs and improve cash flow.
                </Text>
              </View>
            )}
          </View>
        </View>
        
        <View style={[styles.infoBox, { marginTop: 15 }]}>
          <Text style={styles.subsectionTitle}>STRATEGIC RECOMMENDATIONS</Text>
          <Text style={styles.text}>
            Based on comprehensive analysis of your financial situation, I recommend a phased approach to optimize your cash flow:
          </Text>
          <View style={styles.bulletList}>
            <View style={styles.bulletItem}>
              <Text style={styles.bullet}>1.</Text>
              <Text style={styles.bulletText}>
                {monthlySurplus >= 0 
                  ? 'Maximize your current positive cash flow by implementing systematic investment strategies'
                  : 'Focus on expense optimization and income enhancement to achieve positive cash flow'}
              </Text>
            </View>
            <View style={styles.bulletItem}>
              <Text style={styles.bullet}>2.</Text>
              <Text style={styles.bulletText}>
                Build emergency reserves equivalent to 6 months of expenses to ensure financial stability
              </Text>
            </View>
            <View style={styles.bulletItem}>
              <Text style={styles.bullet}>3.</Text>
              <Text style={styles.bulletText}>
                Implement tax-efficient investment strategies to maximize post-tax returns
              </Text>
            </View>
          </View>
        </View>
        
        <View style={[styles.infoBox, { marginTop: 15, backgroundColor: '#F0F8FF' }]}>
          <Text style={styles.subsectionTitle}>PERSONALIZED ADVICE</Text>
          <Text style={styles.text}>
            {clientData?.firstName}, your financial journey requires consistent monitoring and periodic adjustments. 
            I recommend reviewing this plan quarterly to ensure alignment with your evolving financial goals and market conditions. 
            {clientData?.riskTolerance === 'Conservative' 
              ? ' Given your conservative risk profile, we will focus on capital preservation while seeking modest growth.'
              : clientData?.riskTolerance === 'Aggressive'
              ? ' Your aggressive risk profile allows us to explore higher growth opportunities while maintaining prudent risk management.'
              : ' Your moderate risk profile suggests a balanced approach between growth and stability.'}
          </Text>
        </View>
        
        <View style={{ marginTop: 30, borderTop: '1 solid #E5E7EB', paddingTop: 20 }}>
          <Text style={{ fontSize: 10, color: '#666666' }}>
            This analysis is prepared by {advisorData?.firstName} {advisorData?.lastName}, 
            {advisorData?.sebiRegNumber ? ` SEBI Registered Investment Advisor (${advisorData.sebiRegNumber})` : ' Financial Advisor'}, 
            based on the information provided and current market conditions as of {new Date().toLocaleDateString('en-IN')}.
          </Text>
        </View>
      </Page>

      {/* Implementation Timeline & Disclaimers */}
      <Page size="A4" style={styles.page}>
        <Header advisorData={advisorData} pageNumber={12} />
        
        <Text style={styles.sectionTitle}>IMPLEMENTATION TIMELINE</Text>
        
        <Text style={styles.subsectionTitle}>Immediate (0-1 month)</Text>
        <View style={styles.bulletList}>
          <View style={styles.bulletItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>Review and optimize monthly expenses</Text>
          </View>
          <View style={styles.bulletItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>Set up automated savings transfers</Text>
          </View>
          <View style={styles.bulletItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>Open dedicated emergency fund account</Text>
          </View>
        </View>
        
        <Text style={styles.subsectionTitle}>Short-term (1-3 months)</Text>
        <View style={styles.bulletList}>
          <View style={styles.bulletItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>Build emergency fund to 1 month of expenses</Text>
          </View>
          <View style={styles.bulletItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>Start systematic debt repayment plan</Text>
          </View>
          <View style={styles.bulletItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>Begin monthly investment contributions</Text>
          </View>
        </View>
        
        <View style={styles.disclaimer}>
          <Text style={styles.subsectionTitle}>IMPORTANT DISCLAIMERS</Text>
          <Text style={styles.text}>
            • This cash flow analysis is based on information provided and current financial conditions.
          </Text>
          <Text style={styles.text}>
            • Actual results may vary based on changes in income, expenses, and market conditions.
          </Text>
          <Text style={styles.text}>
            • Regular review and updates are recommended to maintain plan effectiveness.
          </Text>
          <Text style={styles.text}>
            • Please consult with a qualified financial advisor before making major financial decisions.
          </Text>
          <Text style={styles.text}>
            • This report is generated using AI-assisted analysis and should be used for guidance only.
          </Text>
        </View>
        
        <Text style={styles.footer}>
          Prepared by {advisorData?.firstName} {advisorData?.lastName} for {clientData?.firstName} {clientData?.lastName} on {new Date().toLocaleDateString('en-IN')}
        </Text>
      </Page>
    </Document>
  );
};

// Export wrapper component for easy integration
export const CashFlowPDFWrapper = ({ data, onGenerate, onError }) => {
  return (
    <BlobProvider document={<CashFlowPDFDocument {...data} />}>
      {({ blob, url, loading, error }) => {
        if (loading) return null;
        if (error) {
          onError?.(error);
          return null;
        }
        if (blob) {
          onGenerate?.(blob, url);
        }
        return null;
      }}
    </BlobProvider>
  );
};

// Export the PDF generation function
export const generateCashFlowPDF = async (data) => {
  try {
    const pdfDoc = <CashFlowPDFDocument {...data} />;
    const blob = await pdf(pdfDoc).toBlob();
    return blob;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

export default CashFlowPDFDocument;