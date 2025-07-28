import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileText, Building, User, Clock, Check, AlertCircle, ArrowLeft, Printer } from 'lucide-react';
import SignatureCanvas from './SignatureCanvas';
import { loeAPI } from '../../services/api';

const LOESignaturePage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loe, setLoe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [signature, setSignature] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSigned, setIsSigned] = useState(false);

  useEffect(() => {
    if (token) {
      loadLOE();
    }
  }, [token]);

  const loadLOE = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('👁️ Loading LOE with token:', token);
      const response = await loeAPI.viewLOE(token);
      
      if (response.success) {
        setLoe(response.data);
        setIsSigned(response.data.isSigned);
        console.log('✅ LOE loaded successfully:', response.data);
      } else {
        setError(response.message || 'Failed to load Letter of Engagement');
      }
    } catch (error) {
      console.error('❌ Error loading LOE:', error);
      setError('This link appears to be invalid or expired. Please contact your advisor for assistance.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignatureChange = (signatureData) => {
    setSignature(signatureData);
  };

  const handleSubmitSignature = async () => {
    if (!signature) {
      alert('Please provide your signature before submitting.');
      return;
    }

    try {
      setIsSubmitting(true);
      
      console.log('✍️ Submitting signature for token:', token);
      const response = await loeAPI.signLOE(token, signature);
      
      if (response.success) {
        setIsSigned(true);
        console.log('✅ LOE signed successfully');
        
        // Show success message and auto-redirect after a few seconds
        setTimeout(() => {
          // Could redirect to a thank you page or close window
        }, 3000);
      } else {
        setError(response.message || 'Failed to submit signature');
      }
    } catch (error) {
      console.error('❌ Error submitting signature:', error);
      setError('Failed to submit signature. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full mx-4">
          <div className="flex items-center justify-center mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
          <p className="text-center text-gray-600">Loading your Letter of Engagement...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full mx-4">
          <div className="flex items-center justify-center mb-4">
            <AlertCircle className="h-12 w-12 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 text-center mb-4">
            Unable to Load Document
          </h2>
          <p className="text-center text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  if (isSigned) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full mx-4">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-green-100 rounded-full p-3">
              <Check className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 text-center mb-4">
            Successfully Signed!
          </h2>
          <p className="text-center text-gray-600 mb-6">
            Your Letter of Engagement has been signed and submitted. Both you and your advisor will receive a confirmation email shortly.
          </p>
          <p className="text-center text-sm text-gray-500">
            You may now close this window.
          </p>
        </div>
      </div>
    );
  }

  const formatExpiryDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <style jsx>{`
        @media print {
          body { margin: 0; }
          .no-print { display: none !important; }
          .document-container { 
            box-shadow: none !important; 
            margin: 0 !important;
            background: white !important;
          }
        }
        
        .document-container {
          font-family: 'Times New Roman', serif;
          line-height: 1.6;
          color: #000;
        }
        
        .document-header {
          border-bottom: 3px solid #1e3a8a;
          margin-bottom: 30px;
          padding-bottom: 20px;
        }
        
        .document-title {
          font-size: 24px;
          font-weight: bold;
          text-align: center;
          margin: 20px 0;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .section-title {
          font-size: 16px;
          font-weight: bold;
          margin: 25px 0 15px 0;
          border-bottom: 1px solid #ccc;
          padding-bottom: 5px;
          text-transform: uppercase;
        }
        
        .document-body p {
          margin: 10px 0;
          text-align: justify;
        }
        
        .signature-section {
          margin-top: 40px;
          border-top: 2px solid #333;
          padding-top: 30px;
        }
        
        .table-style {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
        }
        
        .table-style th,
        .table-style td {
          border: 1px solid #333;
          padding: 12px;
          text-align: left;
        }
        
        .table-style th {
          background-color: #f5f5f5;
          font-weight: bold;
        }
      `}</style>

      {/* Print Button - Hidden during print */}
      <div className="no-print max-w-4xl mx-auto px-4 mb-4">
        <div className="flex justify-end">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            <Printer className="h-4 w-4" />
            Print Document
          </button>
        </div>
      </div>

      {/* PDF-Style Document */}
      <div className="document-container max-w-4xl mx-auto bg-white shadow-lg" style={{ minHeight: '11in', margin: '0 auto', padding: '1in' }}>
        
        {/* Document Header */}
        <div className="document-header">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-bold text-blue-900 mb-2">{loe.advisor.firmName}</h1>
              <div className="text-sm text-gray-700">
                <p><strong>Advisor:</strong> {loe.advisor.name}</p>
                <p><strong>Email:</strong> {loe.advisor.email}</p>
                {loe.advisor.phone && <p><strong>Phone:</strong> {loe.advisor.phone}</p>}
              </div>
            </div>
            <div className="text-right text-sm text-gray-700">
              <p><strong>Document Date:</strong> {currentDate}</p>
              <p><strong>Document ID:</strong> LOE-{token.slice(-8).toUpperCase()}</p>
              <p><strong>Expires:</strong> {formatExpiryDate(loe.expiresAt)}</p>
            </div>
          </div>
        </div>

        {/* Document Title */}
        <div className="document-title">
          LETTER OF ENGAGEMENT
        </div>

        {/* Document Body */}
        <div className="document-body">
          
          {/* Introduction */}
          <div className="mb-8">
            <p>
              This Letter of Engagement ("Agreement") is entered into between <strong>{loe.advisor.firmName}</strong> 
              ("Advisor", "Firm", "We", "Us") and <strong>{loe.client.name}</strong> ("Client", "You") 
              as of the date signed below.
            </p>
          </div>

          {/* Client Information Section */}
          <div className="section-title">1. CLIENT INFORMATION</div>
          <table className="table-style">
            <tbody>
              <tr>
                <td><strong>Client Name:</strong></td>
                <td>{loe.client.name}</td>
              </tr>
              <tr>
                <td><strong>Email Address:</strong></td>
                <td>{loe.client.email}</td>
              </tr>
              <tr>
                <td><strong>Engagement Date:</strong></td>
                <td>{currentDate}</td>
              </tr>
            </tbody>
          </table>

          {/* Services Section */}
          <div className="section-title">2. SERVICES TO BE PROVIDED</div>
          <p>The Advisor agrees to provide the following financial advisory services:</p>
          <ul style={{ marginLeft: '30px', marginTop: '15px' }}>
            {loe.content.services.financialPlanning && (
              <li style={{ marginBottom: '8px' }}>
                <strong>Financial Planning Services:</strong> Comprehensive financial planning including goal setting, 
                cash flow analysis, and strategic financial advice.
              </li>
            )}
            {loe.content.services.investmentAdvisory && (
              <li style={{ marginBottom: '8px' }}>
                <strong>Investment Advisory Services:</strong> Investment portfolio management, asset allocation, 
                and ongoing investment monitoring and rebalancing.
              </li>
            )}
            {loe.content.services.brokerageServices && (
              <li style={{ marginBottom: '8px' }}>
                <strong>Brokerage Services:</strong> Securities transactions, trade execution, 
                and custody services through qualified broker-dealers.
              </li>
            )}
            {loe.content.services.riskManagement && (
              <li style={{ marginBottom: '8px' }}>
                <strong>Risk Management:</strong> Insurance analysis, risk assessment, 
                and recommendations for appropriate risk mitigation strategies.
              </li>
            )}
          </ul>

          {/* Focus Areas */}
          {loe.content.focusAreas && loe.content.focusAreas.length > 0 && (
            <>
              <div className="section-title">3. AREAS OF FOCUS</div>
              <p>Our advisory services will specifically focus on the following areas:</p>
              <ul style={{ marginLeft: '30px', marginTop: '15px' }}>
                {loe.content.focusAreas.map((area, index) => (
                  <li key={index} style={{ marginBottom: '8px' }}>
                    {area}
                  </li>
                ))}
              </ul>
            </>
          )}

          {/* Fee Structure */}
          <div className="section-title">4. FEE STRUCTURE</div>
          <p>The Client agrees to pay the following fees for services rendered:</p>
          
          <table className="table-style">
            <thead>
              <tr>
                <th>Service Type</th>
                <th>Fee Structure</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Financial Planning</td>
                <td>{loe.content.fees.planningFee}</td>
                <td>One-time comprehensive financial plan development</td>
              </tr>
              <tr>
                <td>Investment Advisory</td>
                <td>{loe.content.fees.advisoryFeePercent} annually</td>
                <td>Ongoing portfolio management and advisory services</td>
              </tr>
              {loe.content.fees.advisoryFeeThreshold && (
                <tr>
                  <td>Reduced Advisory Fee</td>
                  <td>{loe.content.fees.advisoryFeeReducedPercent} annually</td>
                  <td>For assets exceeding {loe.content.fees.advisoryFeeThreshold}</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Terms and Conditions */}
          <div className="section-title">5. TERMS AND CONDITIONS</div>
          <p>
            <strong>5.1 Term:</strong> This Agreement shall remain in effect until terminated by either party 
            with thirty (30) days written notice.
          </p>
          <p>
            <strong>5.2 Fiduciary Duty:</strong> The Advisor acknowledges that they will act as a fiduciary 
            with respect to the Client's investment advisory account.
          </p>
          <p>
            <strong>5.3 Confidentiality:</strong> All client information will be kept strictly confidential 
            and will not be disclosed to third parties without client consent.
          </p>
          <p>
            <strong>5.4 Termination:</strong> Either party may terminate this Agreement at any time with 
            written notice. Fees will be pro-rated to the date of termination.
          </p>

          {/* Custom Notes */}
          {loe.content.customNotes && (
            <>
              <div className="section-title">6. ADDITIONAL TERMS</div>
              <p>{loe.content.customNotes}</p>
            </>
          )}

          {/* Signature Section */}
          <div className="signature-section">
            <div className="section-title">CLIENT ACKNOWLEDGMENT AND SIGNATURE</div>
            <p>
              By signing below, I acknowledge that I have read, understood, and agree to be bound by the terms 
              and conditions of this Letter of Engagement. I understand the services to be provided and the 
              associated fees as outlined above.
            </p>

            <div className="mt-8">
              <SignatureCanvas 
                onSignatureChange={handleSignatureChange}
                disabled={isSubmitting}
              />
            </div>

            <div className="mt-8 grid grid-cols-2 gap-8">
              <div>
                <div className="border-b border-black mb-2 pb-1 text-center">
                  <strong>Client Signature (Electronic)</strong>
                </div>
                <p className="text-sm text-center mt-4">
                  {loe.client.name}
                </p>
              </div>
              <div>
                <div className="border-b border-black mb-2 pb-1 text-center">
                  <strong>Date</strong>
                </div>
                <p className="text-sm text-center mt-4">
                  {currentDate}
                </p>
              </div>
            </div>

            <div className="mt-12 no-print">
              <div className="flex justify-center">
                <button
                  onClick={handleSubmitSignature}
                  disabled={!signature || isSubmitting}
                  className="px-8 py-3 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 text-lg"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Submitting Document...
                    </>
                  ) : (
                    <>
                      <FileText className="h-5 w-5" />
                      Submit Signed Document
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer disclaimer - Hidden during print */}
      <div className="no-print max-w-4xl mx-auto px-4 mt-6">
        <p className="text-xs text-gray-500 text-center">
          This document contains confidential and proprietary information. 
          If you have received this in error, please contact {loe.advisor.firmName} immediately.
        </p>
      </div>
    </div>
  );
};

export default LOESignaturePage;