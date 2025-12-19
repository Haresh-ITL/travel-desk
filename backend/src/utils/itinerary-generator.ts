/**
 * Utility function to generate beautiful HTML itinerary templates
 * for travel bookings
 */

export interface ItineraryData {
  employeeName: string;
  employeeId?: string;
  requestUuid: string;
  from: string;
  to: string;
  travelType: 'DOMESTIC' | 'INTERNATIONAL';
  startDate: Date | string;
  endDate: Date | string;
  purpose?: string;
  flight?: string | {
    airline?: string;
    number?: string;
    departureAirport?: string;
    departureTime?: string;
    arrivalAirport?: string;
    arrivalTime?: string;
  };
  hotel?: string | {
    name?: string;
    location?: string;
    phoneNumber?: string;
    roomNumber?: string;
    checkin?: string;
    checkout?: string;
  };
  cab?: string | {
    provider?: string;
    driverName?: string;
    phoneNumber?: string;
    pickupTime?: string;
  };
}

export function generateItineraryHTML(data: ItineraryData): string {
  const formatDate = (date: Date | string | undefined): string => {
    if (!date) return 'N/A';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatDateTime = (date: Date | string | undefined): string => {
    if (!date) return 'N/A';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const flightInfo = typeof data.flight === 'string' 
    ? { display: data.flight }
    : data.flight 
      ? {
          airline: data.flight.airline || 'Airline',
          number: data.flight.number || '',
          departure: `${data.flight.departureAirport || ''} ${data.flight.departureTime || ''}`.trim(),
          arrival: `${data.flight.arrivalAirport || ''} ${data.flight.arrivalTime || ''}`.trim(),
          display: `${data.flight.airline || ''} ${data.flight.number || ''}`.trim() || 'Flight Details'
        }
      : null;

  type HotelInfoType = {
    name?: string;
    location?: string;
    phone?: string;
    room?: string;
    checkin?: string;
    checkout?: string;
    display?: string;
  } | null;

  type CabInfoType = {
    provider?: string;
    driver?: string;
    phone?: string;
    pickupTime?: string;
    display?: string;
  } | null;

  const hotelInfo: HotelInfoType = typeof data.hotel === 'string'
    ? { display: data.hotel }
    : data.hotel
      ? {
          name: data.hotel.name || 'Hotel',
          location: data.hotel.location || '',
          phone: data.hotel.phoneNumber || '',
          room: data.hotel.roomNumber || '',
          checkin: formatDateTime(data.hotel.checkin),
          checkout: formatDateTime(data.hotel.checkout)
        }
      : null;

  const cabInfo: CabInfoType = typeof data.cab === 'string'
    ? { display: data.cab }
    : data.cab
      ? {
          provider: data.cab.provider || 'Cab Service',
          driver: data.cab.driverName || '',
          phone: data.cab.phoneNumber || '',
          pickupTime: formatDateTime(data.cab.pickupTime)
        }
      : null;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Travel Itinerary - ${data.employeeName}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            line-height: 1.6;
            color: #333;
        }
        
        .itinerary-container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 32px;
            margin-bottom: 10px;
            font-weight: 700;
        }
        
        .header p {
            font-size: 16px;
            opacity: 0.9;
        }
        
        .content {
            padding: 40px;
        }
        
        .section {
            margin-bottom: 40px;
        }
        
        .section-title {
            font-size: 24px;
            color: #667eea;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 3px solid #667eea;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .section-title::before {
            content: '';
            width: 4px;
            height: 24px;
            background: #667eea;
            border-radius: 2px;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        
        .info-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 12px;
            border-left: 4px solid #667eea;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .info-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
        }
        
        .info-label {
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 8px;
            font-weight: 600;
        }
        
        .info-value {
            font-size: 16px;
            color: #333;
            font-weight: 600;
        }
        
        .journey-card {
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            padding: 30px;
            border-radius: 12px;
            margin-top: 20px;
            position: relative;
        }
        
        .journey-route {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 20px;
        }
        
        .route-point {
            flex: 1;
            text-align: center;
        }
        
        .route-point-icon {
            width: 60px;
            height: 60px;
            background: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 15px;
            font-size: 24px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .route-point-label {
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
            margin-bottom: 5px;
        }
        
        .route-point-value {
            font-size: 18px;
            font-weight: 700;
            color: #333;
        }
        
        .route-connector {
            flex: 0 0 100px;
            display: flex;
            flex-direction: column;
            align-items: center;
            position: relative;
        }
        
        .route-line {
            width: 100%;
            height: 3px;
            background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
            border-radius: 2px;
            position: relative;
        }
        
        .route-line::after {
            content: '✈';
            position: absolute;
            right: -15px;
            top: -12px;
            font-size: 24px;
            color: #667eea;
        }
        
        .route-details {
            margin-top: 10px;
            text-align: center;
        }
        
        .route-airline {
            font-size: 14px;
            color: #667eea;
            font-weight: 600;
        }
        
        .route-number {
            font-size: 12px;
            color: #666;
        }
        
        .hotel-card {
            background: linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%);
            padding: 30px;
            border-radius: 12px;
            margin-top: 20px;
        }
        
        .hotel-name {
            font-size: 24px;
            font-weight: 700;
            color: #333;
            margin-bottom: 15px;
        }
        
        .hotel-details {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 20px;
        }
        
        .hotel-detail-item {
            background: rgba(255, 255, 255, 0.7);
            padding: 15px;
            border-radius: 8px;
        }
        
        .cab-card {
            background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
            padding: 30px;
            border-radius: 12px;
            margin-top: 20px;
        }
        
        .cab-provider {
            font-size: 20px;
            font-weight: 700;
            color: #333;
            margin-bottom: 15px;
        }
        
        .footer {
            background: #f8f9fa;
            padding: 30px;
            text-align: center;
            color: #666;
            border-top: 1px solid #e9ecef;
        }
        
        .footer p {
            margin: 5px 0;
        }
        
        .badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .badge-domestic {
            background: #d4edda;
            color: #155724;
        }
        
        .badge-international {
            background: #cce5ff;
            color: #004085;
        }
        
        @media print {
            body {
                background: white;
                padding: 0;
            }
            
            .itinerary-container {
                box-shadow: none;
            }
        }
    </style>
</head>
<body>
    <div class="itinerary-container">
        <div class="header">
            <h1>✈ Travel Itinerary</h1>
            <p>${data.employeeName}${data.employeeId ? ` • ${data.employeeId}` : ''}</p>
            <p style="margin-top: 10px; font-size: 14px;">Request ID: ${data.requestUuid}</p>
        </div>
        
        <div class="content">
            <!-- Travel Summary -->
            <div class="section">
                <div class="section-title">Travel Summary</div>
                <div class="info-grid">
                    <div class="info-card">
                        <div class="info-label">From</div>
                        <div class="info-value">${data.from}</div>
                    </div>
                    <div class="info-card">
                        <div class="info-label">To</div>
                        <div class="info-value">${data.to}</div>
                    </div>
                    <div class="info-card">
                        <div class="info-label">Travel Type</div>
                        <div class="info-value">
                            <span class="badge ${data.travelType === 'DOMESTIC' ? 'badge-domestic' : 'badge-international'}">
                                ${data.travelType}
                            </span>
                        </div>
                    </div>
                    <div class="info-card">
                        <div class="info-label">Start Date</div>
                        <div class="info-value">${formatDate(data.startDate)}</div>
                    </div>
                    <div class="info-card">
                        <div class="info-label">End Date</div>
                        <div class="info-value">${formatDate(data.endDate)}</div>
                    </div>
                    ${data.purpose ? `
                    <div class="info-card">
                        <div class="info-label">Purpose</div>
                        <div class="info-value">${data.purpose}</div>
                    </div>
                    ` : ''}
                </div>
            </div>
            
            ${flightInfo ? `
            <!-- Flight Details -->
            <div class="section">
                <div class="section-title">Flight Details</div>
                <div class="journey-card">
                    <div class="journey-route">
                        <div class="route-point">
                            <div class="route-point-icon">🛫</div>
                            <div class="route-point-label">Departure</div>
                            <div class="route-point-value">${flightInfo.departure || data.from}</div>
                        </div>
                        <div class="route-connector">
                            <div class="route-line"></div>
                            <div class="route-details">
                                <div class="route-airline">${flightInfo.airline || flightInfo.display}</div>
                                ${flightInfo.number ? `<div class="route-number">${flightInfo.number}</div>` : ''}
                            </div>
                        </div>
                        <div class="route-point">
                            <div class="route-point-icon">🛬</div>
                            <div class="route-point-label">Arrival</div>
                            <div class="route-point-value">${flightInfo.arrival || data.to}</div>
                        </div>
                    </div>
                </div>
            </div>
            ` : ''}
            
            ${hotelInfo ? `
            <!-- Hotel Details -->
            <div class="section">
                <div class="section-title">Hotel Accommodation</div>
                <div class="hotel-card">
                    <div class="hotel-name">🏨 ${hotelInfo && typeof hotelInfo === 'object' && 'name' in hotelInfo ? hotelInfo.name : (hotelInfo?.display || 'Hotel')}</div>
                    ${typeof hotelInfo === 'object' ? `
                    <div class="hotel-details">
                        ${hotelInfo.location ? `
                        <div class="hotel-detail-item">
                            <div class="info-label">Location</div>
                            <div class="info-value">${hotelInfo.location}</div>
                        </div>
                        ` : ''}
                        ${hotelInfo.room ? `
                        <div class="hotel-detail-item">
                            <div class="info-label">Room Number</div>
                            <div class="info-value">${hotelInfo.room}</div>
                        </div>
                        ` : ''}
                        ${hotelInfo.phone ? `
                        <div class="hotel-detail-item">
                            <div class="info-label">Contact</div>
                            <div class="info-value">${hotelInfo.phone}</div>
                        </div>
                        ` : ''}
                        ${hotelInfo.checkin ? `
                        <div class="hotel-detail-item">
                            <div class="info-label">Check-in</div>
                            <div class="info-value">${hotelInfo.checkin}</div>
                        </div>
                        ` : ''}
                        ${hotelInfo.checkout ? `
                        <div class="hotel-detail-item">
                            <div class="info-label">Check-out</div>
                            <div class="info-value">${hotelInfo.checkout}</div>
                        </div>
                        ` : ''}
                    </div>
                    ` : ''}
                </div>
            </div>
            ` : ''}
            
            ${cabInfo ? `
            <!-- Cab Details -->
            <div class="section">
                <div class="section-title">Local Transport</div>
                <div class="cab-card">
                    <div class="cab-provider">🚕 ${cabInfo && typeof cabInfo === 'object' && 'provider' in cabInfo ? cabInfo.provider : (cabInfo?.display || 'Cab Service')}</div>
                    ${typeof cabInfo === 'object' ? `
                    <div class="hotel-details">
                        ${cabInfo.driver ? `
                        <div class="hotel-detail-item">
                            <div class="info-label">Driver Name</div>
                            <div class="info-value">${cabInfo.driver}</div>
                        </div>
                        ` : ''}
                        ${cabInfo.phone ? `
                        <div class="hotel-detail-item">
                            <div class="info-label">Contact</div>
                            <div class="info-value">${cabInfo.phone}</div>
                        </div>
                        ` : ''}
                        ${cabInfo.pickupTime ? `
                        <div class="hotel-detail-item">
                            <div class="info-label">Pickup Time</div>
                            <div class="info-value">${cabInfo.pickupTime}</div>
                        </div>
                        ` : ''}
                    </div>
                    ` : ''}
                </div>
            </div>
            ` : ''}
        </div>
        
        <div class="footer">
            <p><strong>Safe Travels! 🎉</strong></p>
            <p style="margin-top: 10px; font-size: 12px;">This is an automated itinerary. Please contact travel desk for any changes.</p>
            <p style="font-size: 12px;">Generated on ${new Date().toLocaleString('en-US')}</p>
        </div>
    </div>
</body>
</html>
  `.trim();
}

