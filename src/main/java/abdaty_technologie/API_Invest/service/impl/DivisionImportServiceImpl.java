package abdaty_technologie.API_Invest.service.impl;

import java.io.IOException;
import java.io.InputStream;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import abdaty_technologie.API_Invest.Entity.Divisions;
import abdaty_technologie.API_Invest.Entity.Enum.DivisionType;
import abdaty_technologie.API_Invest.constants.Messages;
import abdaty_technologie.API_Invest.exception.BadRequestException;
import abdaty_technologie.API_Invest.repository.DivisionsRepository;
import abdaty_technologie.API_Invest.service.IDivisionImportService;

@Service
@Transactional
public class DivisionImportServiceImpl implements IDivisionImportService {

    @Autowired
    private DivisionsRepository divisionsRepository;

    /**
     * Importe les divisions depuis un fichier Excel
     * Format attendu: CODE_REGION | REGION | CODE_CERCLE | CERCLE | CODE_ARRONDISSEMENT | ARRONDISSEMENT | CODE_COMMUNE | COMMUNE | CODE_VFQ | VFQ
     */
    @Override
    public String importDivisionsFromExcel(MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            throw new BadRequestException(Messages.FILE_EMPTY);
        }

        if (!isExcelFile(file)) {
            throw new BadRequestException(Messages.FILE_MUST_BE_EXCEL);
        }

        List<Divisions> divisionsToSave = new ArrayList<>();
        Map<String, Divisions> divisionsByCode = new HashMap<>();
        int totalProcessed = 0;
        int totalSaved = 0;

        try (InputStream inputStream = file.getInputStream();
             Workbook workbook = new XSSFWorkbook(inputStream)) {

            Sheet sheet = workbook.getSheetAt(0);
            
            // Ignorer la première ligne (en-têtes)
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                totalProcessed++;

                try {
                    // Extraire les données de chaque niveau hiérarchique
                    String codeRegion = getCellValueAsString(row.getCell(0));
                    String nomRegion = getCellValueAsString(row.getCell(1));
                    String codeCercle = getCellValueAsString(row.getCell(2));
                    String nomCercle = getCellValueAsString(row.getCell(3));
                    String codeArrondissement = getCellValueAsString(row.getCell(4));
                    String nomArrondissement = getCellValueAsString(row.getCell(5));
                    String codeCommune = getCellValueAsString(row.getCell(6));
                    String nomCommune = getCellValueAsString(row.getCell(7));
                    String codeVfq = getCellValueAsString(row.getCell(8));
                    String nomVfq = getCellValueAsString(row.getCell(9));

                    // Créer/récupérer la région
                    Divisions region = createOrGetDivision(codeRegion, nomRegion, DivisionType.REGION, 
                                                         null, divisionsByCode, divisionsToSave);

                    // Créer/récupérer le cercle
                    Divisions cercle = createOrGetDivision(codeCercle, nomCercle, DivisionType.CERCLE, 
                                                         region, divisionsByCode, divisionsToSave);

                    // Créer/récupérer l'arrondissement
                    Divisions arrondissement = createOrGetDivision(codeArrondissement, nomArrondissement, 
                                                                 DivisionType.ARRONDISSEMENT, cercle, 
                                                                 divisionsByCode, divisionsToSave);

                    // Créer/récupérer la commune
                    Divisions commune = createOrGetDivision(codeCommune, nomCommune, DivisionType.COMMUNE, 
                                                          arrondissement, divisionsByCode, divisionsToSave);

                    // Créer le quartier/village/fraction (VFQ) si présent
                    if (codeVfq != null && !codeVfq.trim().isEmpty() && 
                        nomVfq != null && !nomVfq.trim().isEmpty()) {
                        createOrGetDivision(codeVfq, nomVfq, DivisionType.QUARTIER, 
                                          commune, divisionsByCode, divisionsToSave);
                    }

                } catch (Exception e) {
                    System.err.println("Erreur ligne " + (i + 1) + ": " + e.getMessage());
                }
            }

            // Sauvegarder toutes les divisions
            if (!divisionsToSave.isEmpty()) {
                divisionsRepository.saveAll(divisionsToSave);
                totalSaved = divisionsToSave.size();
            }

        } catch (IOException e) {
            throw new IOException(Messages.FILE_READ_ERROR + e.getMessage());
        }

        return String.format("Import terminé: %d lignes traitées, %d divisions importées", 
                           totalProcessed, totalSaved);
    }

    /**
     * Crée ou récupère une division existante
     */
    private Divisions createOrGetDivision(String code, String nom, DivisionType type, 
                                        Divisions parent, Map<String, Divisions> divisionsByCode, 
                                        List<Divisions> divisionsToSave) {
        
        if (code == null || code.trim().isEmpty() || nom == null || nom.trim().isEmpty()) {
            return null;
        }

        code = code.trim();
        nom = nom.trim();

        // Vérifier si la division existe déjà dans le cache
        Divisions existingDivision = divisionsByCode.get(code);
        if (existingDivision != null) {
            return existingDivision;
        }

        // Vérifier si la division existe déjà en base
        if (divisionsRepository.existsByCode(code)) {
            Divisions dbDivision = divisionsRepository.findByCode(code).orElse(null);
            if (dbDivision != null) {
                divisionsByCode.put(code, dbDivision);
                return dbDivision;
            }
        }

        // Créer une nouvelle division
        Divisions division = new Divisions();
        division.setCode(code);
        division.setNom(nom);
        division.setDivisionType(type);
        division.setParent(parent);
        division.setCreation(Instant.now());
        division.setModification(Instant.now());

        divisionsByCode.put(code, division);
        divisionsToSave.add(division);

        return division;
    }

    /**
     * Vérifie si le fichier est un fichier Excel
     */
    private boolean isExcelFile(MultipartFile file) {
        String contentType = file.getContentType();
        String filename = file.getOriginalFilename();
        
        // Vérifier l'extension du fichier
        if (filename != null && filename.toLowerCase().endsWith(".xlsx")) {
            return true;
        }
        
        // Vérifier le content-type
        return contentType != null && 
               (contentType.equals("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") ||
                contentType.equals("application/vnd.ms-excel"));
    }

    /**
     * Extrait la valeur d'une cellule comme String
     */
    private String getCellValueAsString(Cell cell) {
        if (cell == null) {
            return null;
        }

        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue();
            case NUMERIC:
                return String.valueOf((long) cell.getNumericCellValue());
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            case FORMULA:
                return cell.getCellFormula();
            default:
                return null;
        }
    }

    /**
     * Génère un template Excel pour l'import des divisions
     */
    @Override
    public byte[] generateExcelTemplate() throws IOException {
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Divisions");

            // Créer l'en-tête
            Row headerRow = sheet.createRow(0);
            headerRow.createCell(0).setCellValue("CODE_REGION");
            headerRow.createCell(1).setCellValue("REGION");
            headerRow.createCell(2).setCellValue("CODE_CERCLE");
            headerRow.createCell(3).setCellValue("CERCLE");
            headerRow.createCell(4).setCellValue("CODE_ARRONDISSEMENT");
            headerRow.createCell(5).setCellValue("ARRONDISSEMENT");
            headerRow.createCell(6).setCellValue("CODE_COMMUNE");
            headerRow.createCell(7).setCellValue("COMMUNE");
            headerRow.createCell(8).setCellValue("CODE_VFQ");
            headerRow.createCell(9).setCellValue("VFQ");

            // Ajouter quelques exemples
            Row example1 = sheet.createRow(1);
            example1.createCell(0).setCellValue("01");
            example1.createCell(1).setCellValue("KAYES");
            example1.createCell(2).setCellValue("0101");
            example1.createCell(3).setCellValue("KAYES");
            example1.createCell(4).setCellValue("010101");
            example1.createCell(5).setCellValue("KAYES");
            example1.createCell(6).setCellValue("01010101");
            example1.createCell(7).setCellValue("Commune urbaine de Kayes");
            example1.createCell(8).setCellValue("0101010101");
            example1.createCell(9).setCellValue("PLATEAU");

            Row example2 = sheet.createRow(2);
            example2.createCell(0).setCellValue("01");
            example2.createCell(1).setCellValue("KAYES");
            example2.createCell(2).setCellValue("0101");
            example2.createCell(3).setCellValue("KAYES");
            example2.createCell(4).setCellValue("010101");
            example2.createCell(5).setCellValue("KAYES");
            example2.createCell(6).setCellValue("01010101");
            example2.createCell(7).setCellValue("Commune urbaine de Kayes");
            example2.createCell(8).setCellValue("0101010102");
            example2.createCell(9).setCellValue("LIBERTÉ");

            // Ajuster la largeur des colonnes
            for (int i = 0; i < 10; i++) {
                sheet.autoSizeColumn(i);
            }

            // Convertir en byte array
            java.io.ByteArrayOutputStream outputStream = new java.io.ByteArrayOutputStream();
            workbook.write(outputStream);
            return outputStream.toByteArray();
        }
    }
}
