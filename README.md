# NatWest Credit Card Application

A modern, secure digital credit card application platform built with Next.js 14, featuring digital identity verification using PingOne APIs.

## 🏦 **Project Overview**

This application demonstrates a complete credit card application flow using digital identity verification (Verifiable Credentials) instead of traditional paper-based processes. Users can apply for credit cards by scanning a QR code and completing verification through their mobile banking app.

## ✨ **Features**

- **Digital Identity Verification**: Secure QR code-based verification using PingOne APIs
- **Real-time Status Updates**: Live polling for verification status with automatic step transitions
- **Credit Assessment Engine**: Automated credit eligibility assessment and limit calculation
- **Modern UI/UX**: Beautiful, responsive design with Framer Motion animations
- **Professional Banking Experience**: NatWest branding and secure application flow
- **Mobile-First Design**: Optimized for both desktop and mobile devices

## 🚀 **Technology Stack**

- **Frontend**: Next.js 14 with App Router, React 18, TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **Animations**: Framer Motion for smooth transitions and micro-interactions
- **Authentication**: PingOne Digital Identity APIs for secure verification
- **State Management**: React hooks with custom verification polling hook
- **Deployment**: Vercel for hosting and Git for version control

## 🏗️ **Architecture**

### **Core Components**

1. **Home Page** (`src/app/page.tsx`)
   - Landing page with NatWest branding
   - Feature highlights and call-to-action
   - Navigation to credit card application

2. **Credit Card Application** (`src/app/credit-card/page.tsx`)
   - Main application flow page
   - Hosts the CreditCardApplication component

3. **CreditCardApplication Component** (`components/credit-card/CreditCardApplication.tsx`)
   - Multi-step verification flow
   - QR code generation and display
   - Real-time status polling
   - Credit assessment and application submission

### **API Integration**

- **PingOne Authentication**: OAuth2 token management
- **Presentation Requests**: QR code generation for mobile app interaction
- **Verification Status**: Real-time polling for verification progress
- **Credential Data**: Secure extraction and processing of verified information

### **State Management**

- **Verification Steps**: Initial → QR Display → Verifying → Completed/Failed
- **Real-time Updates**: Custom `useVerificationPolling` hook for status monitoring
- **Error Handling**: Comprehensive error states with user-friendly messages
- **Session Management**: Automatic timeout and cleanup

## 📱 **User Flow**

1. **Landing Page**: User visits the home page and clicks "Apply for Credit Card"
2. **Card Selection**: User selects their preferred credit card type
3. **Verification Start**: System generates QR code and starts verification process
4. **Mobile Interaction**: User scans QR code with their NatWest mobile app
5. **Biometric Verification**: User completes verification in the mobile app
6. **Real-time Updates**: Website polls for verification status and updates UI
7. **Credit Assessment**: System automatically assesses eligibility and calculates limits
8. **Application Completion**: User receives approval and card details

## 🛠️ **Installation & Setup**

### **Prerequisites**

- Node.js 18+ and npm
- Git for version control
- PingOne account with Digital Identity APIs configured

### **Environment Variables**

Create a `.env.local` file with your PingOne credentials:

```env
PINGONE_CLIENT_ID=your_client_id
PINGONE_CLIENT_SECRET=your_client_secret
PINGONE_ENVIRONMENT_ID=your_environment_id
```

### **Installation Steps**

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd natwest-credit-card
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your PingOne credentials
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## 🔧 **Development**

### **Available Scripts**

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### **Project Structure**

```
natwest-credit-card/
├── src/
│   └── app/                    # Next.js App Router
│       ├── credit-card/        # Credit card application page
│       ├── globals.css         # Global styles
│       ├── layout.tsx          # Root layout
│       └── page.tsx            # Home page
├── components/                  # React components
│   ├── credit-card/            # Credit card specific components
│   └── ui/                     # Reusable UI components
├── hooks/                       # Custom React hooks
├── lib/                         # Utility functions and API
├── types/                       # TypeScript type definitions
└── public/                      # Static assets
```

## 🔒 **Security Features**

- **Digital Identity Verification**: Uses industry-standard Verifiable Credentials
- **Secure API Communication**: All API calls use HTTPS with proper authentication
- **Data Privacy**: User data is never stored, only processed for verification
- **Session Management**: Automatic timeout and cleanup for security
- **Error Handling**: Secure error messages that don't expose sensitive information

## 🚀 **Deployment**

### **Vercel Deployment**

1. **Connect to Vercel**
   ```bash
   npm i -g vercel
   vercel login
   vercel
   ```

2. **Set Environment Variables**
   - Add your PingOne credentials in Vercel dashboard
   - Ensure all required environment variables are set

3. **Deploy**
   ```bash
   vercel --prod
   ```

### **Git Deployment**

1. **Initialize Git repository**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: NatWest Credit Card Application"
   ```

2. **Connect to remote repository**
   ```bash
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

## 🧪 **Testing**

### **Manual Testing**

1. **Home Page Navigation**: Test all navigation links and buttons
2. **Credit Card Application**: Complete the full verification flow
3. **Responsive Design**: Test on different screen sizes
4. **Error Handling**: Test various error scenarios

### **API Testing**

1. **PingOne Integration**: Verify API calls and responses
2. **QR Code Generation**: Test QR code creation and display
3. **Status Polling**: Verify real-time status updates
4. **Error Scenarios**: Test network failures and API errors

## 🔮 **Future Enhancements**

- **Multi-language Support**: Internationalization for global markets
- **Advanced Analytics**: User behavior tracking and conversion optimization
- **A/B Testing**: Experiment with different UI/UX approaches
- **Mobile App Integration**: Deep linking and push notifications
- **Additional Card Types**: Support for business and premium cards
- **Document Upload**: Fallback to traditional document verification
- **Real-time Chat**: Customer support integration

## 📄 **License**

This project is proprietary and confidential. All rights reserved by NatWest Bank.

## 🤝 **Contributing**

This is a demonstration project. For production use, please contact NatWest Bank's development team.

## 📞 **Support**

For technical support or questions about this application:
- **Email**: dev-support@natwest.com
- **Documentation**: [Internal Wiki](https://wiki.natwest.com/digital-credentials)
- **Slack**: #digital-credentials-support

---

**Built with ❤️ by NatWest Digital Innovation Team**
