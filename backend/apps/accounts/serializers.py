from rest_framework import serializers
from .models import User, Department, Role


# ---------- Department ----------
class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ['id', 'department_name', 'is_active']
        extra_kwargs = {"is_active": {"required": False}}


# ---------- Role ----------
class RoleSerializer(serializers.ModelSerializer):
    department = serializers.PrimaryKeyRelatedField(queryset=Department.objects.all())

    class Meta:
        model = Role
        fields = ['id', 'role_name', 'department', 'is_active']
        extra_kwargs = {"is_active": {"required": False}}


# ---------- User ----------
# ---------- User ----------
class UserSerializer(serializers.ModelSerializer):
    # Include readable fields
    role_name = serializers.CharField(source="role.role_name", read_only=True)
    department_name = serializers.CharField(source="department.department_name", read_only=True)

    department = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all(), allow_null=True
    )
    role = serializers.PrimaryKeyRelatedField(
        queryset=Role.objects.all(), allow_null=True
    )

    class Meta:
        model = User
        fields = [
            "id", "username", "first_name", "last_name",
            "email", "phone", "is_active", "date_joined",
            "department", "department_name",
            "role", "role_name",
        ]
        read_only_fields = ["id", "date_joined"]

# ---------- Register ----------
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            "id", "username", "email", "phone", "password",
            "first_name", "last_name", "department", "role",
        ]

    def validate(self, data):
        if User.objects.filter(username__iexact=data["username"]).exists():
            raise serializers.ValidationError({"username": "EP016"})
        if User.objects.filter(email__iexact=data["email"]).exists():
            raise serializers.ValidationError({"email": "ES003"})
        return data

    def create(self, validated_data):
        password = validated_data.pop("password", None)

        if not validated_data.get("department"):
            validated_data["department"] = Department.objects.filter(
                department_name__iexact="General", is_active=True
            ).first()

        if not validated_data.get("role") and validated_data.get("department"):
            validated_data["role"] = Role.objects.filter(
                role_name__iexact="User",
                department=validated_data["department"],
                is_active=True,
            ).first()

        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user
