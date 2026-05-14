# Jewellery Purchase Popup Implementation

## Overview
Added a confirmation popup that asks "Are you purchasing jewellery?" before showing the cross form for textiles customers who don't have an address yet.

## Changes Made

### File: `components/customer/customer-shell.tsx`

#### 1. Added State Management
- Added `showJewelleryPopup` state to control the popup visibility

```typescript
const [showJewelleryPopup, setShowJewelleryPopup] = useState(false);
```

#### 2. Modified Lookup Logic
When a customer with `billing_verified` status is found but has no address:
- **Before**: Directly navigated to `textiles_jewellery_cross` step
- **After**: Shows the jewellery purchase confirmation popup

```typescript
} else {
  // Address missing -> ask if purchasing jewellery first
  setShowJewelleryPopup(true);
}
```

#### 3. Added Jewellery Purchase Popup Modal
A premium-designed modal with two options:

**Option 1: "Yes, I am"**
- Proceeds to the cross form (`textiles_jewellery_cross` step)
- Allows customer to complete jewellery registration with address

**Option 2: "No, not today"**
- Shows existing membership card with QR code (`existing_found` step)
- Customer can use their textiles membership without jewellery registration

## User Flow

### For Regular Customers (No Address)
1. Customer enters mobile number
2. System detects: `billing_verified` status + no address
3. **NEW**: Popup appears asking "Are you purchasing jewellery?"
4. Customer chooses:
   - **YES** → Cross form appears → Fill address → Get jewellery membership
   - **NO** → QR code with membership details appears → Can proceed with textiles purchase

### For Customers with Address
- No change in behavior
- Directly shows existing membership card with QR code

### For New Customers
- No change in behavior
- Shows registration form as usual

## Design Features

The popup includes:
- Premium gradient header with blue theme
- Decorative background elements
- Two clear action buttons with hover effects
- Green theme for "Yes" option (positive action)
- Blue theme for "No" option (neutral action)
- Smooth animations and transitions
- Mobile-responsive design (bottom sheet on mobile, centered modal on desktop)

## Benefits

1. **Better UX**: Customers aren't forced into jewellery registration if they're only buying textiles
2. **Flexibility**: Allows customers to skip address entry if not purchasing jewellery
3. **Clear Intent**: Explicitly asks about purchase intent before collecting additional information
4. **Maintains Flow**: Existing customers with addresses see no change in behavior
