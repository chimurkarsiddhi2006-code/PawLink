# PawLink

PawLink is a responsive hyperlocal animal-care coordination prototype. It turns one concerned neighbour’s report into a shared case that can move from rescue to treatment, recovery, adoption, or closure.

## Included

- Warm, mobile-friendly public landing page with human-first copy
- Detailed animal-report form with photo preview and browser location capture
- Separate network landing page for vets, rescue NGOs, shelters, pharmacies, volunteers, and municipal teams
- Role-aware workspaces at `role.html?role=vet`, `ngo`, `shelter`, `pharmacy`, `authority`, or `citizen`
- Live-style case tracker, case list, care activity, and area coverage view
- Google sign-in hook using Firebase Authentication
- Firestore case creation hook and a restrictive starter rules file

## Run locally

Use a local server so ES modules and the location feature run correctly:

```powershell
npx serve .
```

Then open the local URL shown in the terminal. The site can also be deployed directly to Firebase Hosting, Netlify, or Vercel.

## Connect Firebase securely

1. Create a Firebase project and register a Web app.
2. In Firebase Authentication, enable **Google** under Sign-in method and add your production domain to Authorized domains.
3. Put the Firebase Web configuration values in `firebase-config.js`.
4. Create a Firestore database, then publish the starter rules from `firestore.rules`.
5. Use Firebase custom claims for partner roles (`vet`, `ngo`, `shelter`, `pharmacy`, `authority`, or `admin`). Set claims only from a trusted server/Admin SDK—never in browser code.
6. Before launch, add Firebase App Check, Cloud Storage rules for report photos, rate limiting (Cloud Functions or Cloudflare), consent text, and a proper emergency-escalation process.

The site intentionally has no API keys other than the Firebase project configuration you add. Firebase configuration is public by design; Firestore/Storage rules and verified custom claims are what protect the data.
