import React, { useState, useEffect } from 'react';
import { X, FileText, CheckCircle, Printer } from 'lucide-react';
import { loeAPI } from '../../services/api';
import toast from 'react-hot-toast';

const LOEViewModal = ({ isOpen, onClose, loe }) => {
  const [loeDetails, setLoeDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && loe?.accessToken) {
      fetchLOEDetails();
    }
  }, [isOpen, loe]);

  const fetchLOEDetails = async () => {
    try {
      setLoading(true);
      const response = await loeAPI.viewLOE(loe.accessToken);
      
      if (response.success) {
        console.log('🖊️ [LOEViewModal] LOE Details loaded:', {
          isSigned: response.data.isSigned,
          hasSignature: !!response.data.signature,
          signatureLength: response.data.signature?.length,
          signatureTimestamp: response.data.signatureTimestamp,
          signaturePreview: response.data.signature?.substring(0, 100),
          signatureIsDataUrl: response.data.signature?.startsWith('data:'),
          signatureFormat: response.data.signature?.substring(0, 30)
        });
        setLoeDetails(response.data);
      } else {
        toast.error('Failed to load LOE details');
      }
    } catch (error) {
      console.error('Error fetching LOE details:', error);
      toast.error('Failed to load LOE details');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <FileText className="h-6 w-6 mr-2" />
            Letter of Engagement
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Print"
            >
              <Printer className="h-5 w-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : loeDetails ? (
            <div className="document-content">
              <style jsx>{`
                @media print {
                  .no-print { display: none !important; }
                }
                
                .document-content {
                  font-family: 'Times New Roman', serif;
                  line-height: 1.6;
                  color: #000;
                }
                
                .section-title {
                  font-size: 16px;
                  font-weight: bold;
                  margin: 25px 0 15px 0;
                  border-bottom: 1px solid #ccc;
                  padding-bottom: 5px;
                  text-transform: uppercase;
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

              {/* Document Header */}
              <div className="mb-8 pb-6 border-b-2 border-gray-300">
                <h1 className="text-2xl font-bold text-center mb-4">LETTER OF ENGAGEMENT</h1>
                <div className="flex justify-between text-sm">
                  <div>
                    <p><strong>Firm:</strong> {loeDetails.advisor?.firmName}</p>
                    <p><strong>Advisor:</strong> {loeDetails.advisor?.name}</p>
                    <p><strong>Email:</strong> {loeDetails.advisor?.email}</p>
                  </div>
                  <div className="text-right">
                    <p><strong>Date:</strong> {formatDate(loeDetails.createdAt)}</p>
                    <p><strong>Status:</strong> <span className="text-green-600 font-semibold">{loeDetails.status}</span></p>
                  </div>
                </div>
              </div>

              {/* Client Information */}
              <div className="section-title">CLIENT INFORMATION</div>
              <table className="table-style">
                <tbody>
                  <tr>
                    <td width="30%"><strong>Name:</strong></td>
                    <td>{loeDetails.client?.name}</td>
                  </tr>
                  <tr>
                    <td><strong>Email:</strong></td>
                    <td>{loeDetails.client?.email}</td>
                  </tr>
                  <tr>
                    <td><strong>Date Signed:</strong></td>
                    <td>{loeDetails.isSigned ? formatDate(loeDetails.signature?.timestamp) : 'Not signed'}</td>
                  </tr>
                </tbody>
              </table>

              {/* Services */}
              <div className="section-title">SERVICES PROVIDED</div>
              <ul className="list-disc list-inside space-y-2 ml-4">
                {loeDetails.content?.services?.financialPlanning && (
                  <li>Financial Planning Services</li>
                )}
                {loeDetails.content?.services?.investmentAdvisory && (
                  <li>Investment Advisory Services</li>
                )}
                {loeDetails.content?.services?.brokerageServices && (
                  <li>Brokerage Services</li>
                )}
                {loeDetails.content?.services?.riskManagement && (
                  <li>Risk Management Services</li>
                )}
              </ul>

              {/* Focus Areas */}
              {loeDetails.content?.focusAreas?.length > 0 && (
                <>
                  <div className="section-title">AREAS OF FOCUS</div>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    {loeDetails.content.focusAreas.map((area, index) => (
                      <li key={index}>{area}</li>
                    ))}
                  </ul>
                </>
              )}

              {/* Fee Structure */}
              <div className="section-title">FEE STRUCTURE</div>
              <table className="table-style">
                <thead>
                  <tr>
                    <th>Service</th>
                    <th>Fee</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Financial Planning</td>
                    <td>{loeDetails.content?.fees?.planningFee}</td>
                    <td>One-time comprehensive financial plan</td>
                  </tr>
                  <tr>
                    <td>Investment Advisory</td>
                    <td>{loeDetails.content?.fees?.advisoryFeePercent} annually</td>
                    <td>Ongoing portfolio management</td>
                  </tr>
                  {loeDetails.content?.fees?.advisoryFeeThreshold && (
                    <tr>
                      <td>Reduced Advisory Fee</td>
                      <td>{loeDetails.content?.fees?.advisoryFeeReducedPercent} annually</td>
                      <td>For assets exceeding {loeDetails.content?.fees?.advisoryFeeThreshold}</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Custom Notes */}
              {loeDetails.content?.customNotes && (
                <>
                  <div className="section-title">ADDITIONAL NOTES</div>
                  <p className="text-gray-700">{loeDetails.content.customNotes}</p>
                </>
              )}

              {/* Signature Section */}
              {loeDetails.isSigned && (
                <>
                  <div className="section-title">CLIENT SIGNATURE</div>
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      {loeDetails.signature ? (
                        <div>
                          <img 
                            src={loeDetails.signature} 
                            alt="Client Signature" 
                            className="mx-auto mb-4 border border-gray-300 bg-white p-2 rounded"
                            style={{ maxHeight: '120px', maxWidth: '300px' }}
                            onError={(e) => {
                              console.error('🖊️ Signature image failed to load:', {
                                src: e.target.src,
                                srcLength: e.target.src?.length,
                                isDataUrl: e.target.src?.startsWith('data:'),
                                srcPreview: e.target.src?.substring(0, 100),
                                error: e
                              });
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'block';
                            }}
                            onLoad={(e) => {
                              console.log('🖊️ Signature image loaded successfully:', {
                                naturalWidth: e.target.naturalWidth,
                                naturalHeight: e.target.naturalHeight
                              });
                            }}
                          />
                          <div 
                            className="hidden text-gray-500 italic p-4 border border-gray-300 rounded bg-white"
                            style={{ maxWidth: '300px', margin: '0 auto' }}
                          >
                            [Signature image could not be displayed]
                            <br />
                            <small>Check browser console for details</small>
                          </div>
                        </div>
                      ) : (
                        <div className="text-gray-500 italic p-4 border border-gray-300 rounded bg-white">
                          [Electronic signature recorded]
                        </div>
                      )}
                      <p className="text-sm text-gray-600 mt-4">
                        Signed electronically on {formatDate(loeDetails.signatureTimestamp)}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p>Unable to load LOE details</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 no-print">
          <div>
            {loeDetails?.isSigned && (
              <div className="flex items-center text-green-600">
                <CheckCircle className="h-5 w-5 mr-2" />
                <span className="font-medium">Signed on {formatDate(loeDetails.signatureTimestamp)}</span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default LOEViewModal;