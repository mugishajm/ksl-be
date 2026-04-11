import { useState, useEffect, useRef } from "react";
import { Link, Navigate } from "react-router-dom";
import { ArrowLeft, User, Mail, Camera, Edit2, Save, X } from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/context/LanguageContext";
import { Alert, AlertDescription } from "@/components/ui/alert";

type StoredUser = { id?: string; firstName?: string; lastName?: string; email?: string; role?: string; profilePicture?: string } | null;

const Profile = () => {
  const { language } = useLanguage();
  const [user, setUser] = useState<StoredUser | undefined>(undefined);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    profilePicture: ""
  });
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("ksl_user");
      const userData = raw ? (JSON.parse(raw) as StoredUser) : null;
      setUser(userData);
      if (userData) {
        setEditForm({
          firstName: userData.firstName || "",
          lastName: userData.lastName || "",
          profilePicture: userData.profilePicture || ""
        });
      }
    } catch {
      setUser(null);
    }
  }, []);

  if (user === null) return <Navigate to="/auth" replace />;
  if (user === undefined) return null; // brief loading

  const displayName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.email ?? "Profile";

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setUploadError("Image size should be less than 5MB");
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        setUploadError("Please upload an image file");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPreviewImage(result);
        setEditForm(prev => ({ ...prev, profilePicture: result }));
        setUploadError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    try {
      const updatedUser = {
        ...user,
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        profilePicture: editForm.profilePicture
      };
      
      localStorage.setItem("ksl_user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      window.dispatchEvent(new Event("ksl-user-update"));
      
      setSuccessMessage(
        language === "kinyarwanda"
          ? "Ibyahinduwe byakiriwe neza!"
          : language === "french"
          ? "Modifications enregistrées avec succès!"
          : "Profile updated successfully!"
      );
      
      setIsEditing(false);
      
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      setUploadError(
        language === "kinyarwanda"
          ? "Hakikije ibyo wahinduye"
          : language === "french"
          ? "Veuillez vérifier vos modifications"
          : "Please check your changes"
      );
    }
  };

  const handleCancel = () => {
    setEditForm({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      profilePicture: user?.profilePicture || ""
    });
    setPreviewImage(null);
    setIsEditing(false);
    setUploadError(null);
  };

  const currentProfilePicture = previewImage || editForm.profilePicture || "";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-2xl mx-auto">
          <Button asChild variant="ghost" size="sm" className="mb-6 gap-2">
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
              {language === "kinyarwanda"
                ? "Subira ku rupapuro rw'itangiriro"
                : language === "french"
                ? "Retour à l'accueil"
                : "Back to home"}
            </Link>
          </Button>

          {successMessage && (
            <Alert className="mb-6 bg-emerald-500/20 border-emerald-500 text-emerald-300">
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          )}

          {uploadError && (
            <Alert className="mb-6 bg-red-500/20 border-red-500 text-red-300">
              <AlertDescription>{uploadError}</AlertDescription>
            </Alert>
          )}

          <Card className="border-border shadow-card">
            <CardHeader className="text-center pb-2">
              <div className="flex justify-center mb-4 relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={currentProfilePicture} alt={displayName} />
                  <AvatarFallback className="bg-primary/20 text-primary text-3xl">
                    {(user?.firstName?.[0] ?? user?.email?.[0] ?? "?").toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <Button
                    size="sm"
                    className="absolute bottom-0 right-0 rounded-full p-2 bg-primary hover:bg-primary/90"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera className="h-4 w-4 text-primary-foreground" />
                  </Button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
              <CardTitle className="font-display text-2xl">{displayName}</CardTitle>
              <CardDescription>
                {language === "kinyarwanda"
                  ? "Konti yawe ya KSL AI"
                  : language === "french"
                  ? "Votre compte KSL AI"
                  : "Your KSL AI account"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">
                        {language === "kinyarwanda"
                          ? "Izina ry'Itangwa"
                          : language === "french"
                          ? "Prénom"
                          : "First Name"}
                      </Label>
                      <Input
                        id="firstName"
                        value={editForm.firstName}
                        onChange={(e) => setEditForm(prev => ({ ...prev, firstName: e.target.value }))}
                        placeholder={
                          language === "kinyarwanda"
                            ? "Shyiramo izina ry'itangwa"
                            : language === "french"
                            ? "Entrez votre prénom"
                            : "Enter your first name"
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">
                        {language === "kinyarwanda"
                          ? "Izina ry'Umuryango"
                          : language === "french"
                          ? "Nom"
                          : "Last Name"}
                      </Label>
                      <Input
                        id="lastName"
                        value={editForm.lastName}
                        onChange={(e) => setEditForm(prev => ({ ...prev, lastName: e.target.value }))}
                        placeholder={
                          language === "kinyarwanda"
                            ? "Shyiramo izina ry'umuryango"
                            : language === "french"
                            ? "Entrez votre nom"
                            : "Enter your last name"
                        }
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button onClick={handleSave} className="flex-1">
                      <Save className="h-4 w-4 mr-2" />
                      {language === "kinyarwanda"
                        ? "Bika"
                        : language === "french"
                        ? "Enregistrer"
                        : "Save"}
                    </Button>
                    <Button onClick={handleCancel} variant="outline" className="flex-1">
                      <X className="h-4 w-4 mr-2" />
                      {language === "kinyarwanda"
                        ? "Kuraho"
                        : language === "french"
                        ? "Annuler"
                        : "Cancel"}
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {language === "kinyarwanda"
                          ? "Izina"
                          : language === "french"
                          ? "Nom"
                          : "Name"}
                      </p>
                      <p className="font-medium">
                        {user?.firstName && user?.lastName
                          ? `${user.firstName} ${user.lastName}`
                          : "—"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {language === "kinyarwanda"
                          ? "Imeli"
                          : language === "french"
                          ? "E-mail"
                          : "Email"}
                      </p>
                      <p className="font-medium">{user?.email ?? "—"}</p>
                    </div>
                  </div>
                  <div className="pt-4 flex gap-3">
                    <Button 
                      onClick={() => setIsEditing(true)} 
                      variant="outline" 
                      className="flex-1"
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      {language === "kinyarwanda"
                        ? "Hindura imyirondoro"
                        : language === "french"
                        ? "Modifier le profil"
                        : "Edit Profile"}
                    </Button>
                    <Button asChild variant="hero" className="flex-1">
                      <Link to="/settings">
                        {language === "kinyarwanda"
                          ? "Igenamiterere"
                          : language === "french"
                          ? "Paramètres"
                          : "Settings"}
                      </Link>
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Profile;
