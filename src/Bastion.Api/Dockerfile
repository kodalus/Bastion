FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["src/Bastion.Api/Bastion.Api.csproj", "src/Bastion.Api/"]
COPY ["src/Bastion.Application/Bastion.Application.csproj", "src/Bastion.Application/"]
COPY ["src/Bastion.Domain/Bastion.Domain.csproj", "src/Bastion.Domain/"]
COPY ["src/Bastion.Infrastructure/Bastion.Infrastructure.csproj", "src/Bastion.Infrastructure/"]
RUN dotnet restore "src/Bastion.Api/Bastion.Api.csproj"

COPY . .
RUN dotnet build "src/Bastion.Api/Bastion.Api.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "src/Bastion.Api/Bastion.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Bastion.Api.dll"]
