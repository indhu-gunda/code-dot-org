import React from 'react';
import {Provider} from 'react-redux';
import {
  getStore,
  registerReducers,
  stubRedux,
  restoreRedux
} from '@cdo/apps/redux';
import i18n from '@cdo/locale';
import {expect} from '../../../util/deprecatedChai';
import {shallow, mount} from 'enzyme';
import ManageStudentsTable, {
  UnconnectedManageStudentsTable,
  sortRows
} from '@cdo/apps/templates/manageStudents/ManageStudentsTable';
import ManageStudentsActionsCell from '@cdo/apps/templates/manageStudents/ManageStudentsActionsCell';
import ManageStudentNameCell from '@cdo/apps/templates/manageStudents/ManageStudentsNameCell';
import {SectionLoginType} from '@cdo/apps/util/sharedConstants';
import manageStudents, {
  RowType,
  setLoginType,
  setStudents,
  startEditingStudent
} from '@cdo/apps/templates/manageStudents/manageStudentsRedux';
import teacherSections, {
  setSections
} from '@cdo/apps/templates/teacherDashboard/teacherSectionsRedux';
import sectionData, {setSection} from '@cdo/apps/redux/sectionDataRedux';
import scriptSelection from '@cdo/apps/redux/scriptSelectionRedux';
import isRtl from '@cdo/apps/code-studio/isRtlRedux';

describe('ManageStudentsTable', () => {
  it('sortRows orders table in the following order: add, newStudent, student', () => {
    const rowData = [
      {id: 1, name: 'studentb', rowType: RowType.STUDENT},
      {id: 3, name: 'studenta', rowType: RowType.STUDENT},
      {id: 0, name: '', rowType: RowType.ADD},
      {id: 2, name: 'studentf', rowType: RowType.NEW_STUDENT}
    ];
    const columnIndexList = [];
    const orderList = ['asc'];
    const sortedList = sortRows(rowData, columnIndexList, orderList);
    expect(sortedList[0].id).to.equal(0);
    expect(sortedList[1].id).to.equal(2);
    expect(sortedList[2].id).to.equal(1);
    expect(sortedList[3].id).to.equal(3);
  });

  it('does not render MoveStudents if loginType is google_classroom', () => {
    const wrapper = shallow(
      <UnconnectedManageStudentsTable
        loginType={SectionLoginType.google_classroom}
        studentData={[]}
        editingData={{}}
        addStatus={{}}
        transferStatus={{}}
      />
    );

    expect(wrapper.find('MoveStudents').exists()).to.be.false;
  });

  it('does not render MoveStudents if loginType is clever', () => {
    const wrapper = shallow(
      <UnconnectedManageStudentsTable
        loginType={SectionLoginType.clever}
        studentData={[]}
        editingData={{}}
        addStatus={{}}
        transferStatus={{}}
      />
    );

    expect(wrapper.find('MoveStudents').exists()).to.be.false;
  });

  describe('full render tests', () => {
    const fakeStudent = {
      id: 1,
      name: 'Clark Kent',
      username: 'clark_kent',
      sectionId: 101,
      hasEverSignedIn: true,
      dependsOnThisSectionForLogin: true,
      loginType: 'picture',
      rowType: RowType.STUDENT
    };
    const fakeStudents = {
      [fakeStudent.id]: fakeStudent
    };
    const fakeSection = {
      id: 101,
      location: '/v2/sections/101',
      name: 'My Section',
      login_type: SectionLoginType.picture,
      grade: '2',
      code: 'PMTKVH',
      lesson_extras: false,
      pairing_allowed: true,
      sharing_disabled: false,
      script: null,
      course_id: 29,
      studentCount: 10,
      students: Object.values(fakeStudents),
      hidden: false
    };

    beforeEach(() => {
      stubRedux();
      registerReducers({
        teacherSections,
        manageStudents,
        isRtl,
        sectionData,
        scriptSelection
      });
      const store = getStore();
      store.dispatch(setLoginType(fakeSection.login_type));
      store.dispatch(setSections([fakeSection]));
      store.dispatch(setSection(fakeSection));
      store.dispatch(setStudents(fakeStudents));
    });

    afterEach(() => {
      restoreRedux();
    });

    it('renders an action cell for each student', () => {
      const wrapper = mount(
        <Provider store={getStore()}>
          <ManageStudentsTable />
        </Provider>
      );
      expect(wrapper).to.containMatchingElement(
        <ManageStudentsActionsCell
          id={fakeStudent.id}
          sectionId={fakeStudent.sectionId}
          rowType={RowType.STUDENT}
          loginType={fakeStudent.loginType}
          studentName={fakeStudent.name}
          hasEverSignedIn={fakeStudent.hasEverSignedIn}
          dependsOnThisSectionForLogin={
            fakeStudent.dependsOnThisSectionForLogin
          }
        />
      );
    });

    it('renders an editable name field', async () => {
      const wrapper = mount(
        <Provider store={getStore()}>
          <ManageStudentsTable />
        </Provider>
      );
      // Begin editing the student
      // (Using redux directly to do this requires us to trigger a manual update)
      getStore().dispatch(startEditingStudent(fakeStudent.id));
      wrapper.update();

      const manageStudentNameCell = () =>
        wrapper
          .find(ManageStudentNameCell)
          .findWhere(w => w.prop('id') === fakeStudent.id)
          .first();

      // Check for a name cell with expecting initial editing props
      expect(manageStudentNameCell().exists()).to.be.true;
      expect(manageStudentNameCell().prop('isEditing')).to.be.true;

      // Find the name input
      const nameInput = () =>
        manageStudentNameCell()
          .find('input')
          .first();
      expect(nameInput().prop('value')).to.equal(fakeStudent.name);

      // Simulate a name change
      nameInput().simulate('change', {target: {value: fakeStudent.name + 'z'}});

      // Expect the input box value to have changed
      expect(nameInput().prop('value')).to.equal(fakeStudent.name + 'z');
    });

    it('renders correctly if loginType is picture', () => {
      const wrapper = mount(
        <Provider store={getStore()}>
          <ManageStudentsTable />
        </Provider>
      );
      const passwordColumnHeader = wrapper.find('#password-header');
      expect(passwordColumnHeader).to.have.lengthOf(1);
      expect(passwordColumnHeader.text()).to.equal(i18n.picturePassword());
      const showSecret = wrapper.find('ShowSecret');
      expect(showSecret).to.have.lengthOf(1);
      expect(showSecret.find('Button').text()).to.equal(i18n.showPicture());
      const loginInfo = wrapper.find('ManageStudentsLoginInfo');
      expect(loginInfo.props().loginType).to.equal(SectionLoginType.picture);
      expect(loginInfo.find('SignInInstructions').props().loginType).to.equal(
        SectionLoginType.picture
      );
    });

    it('renders correctly if loginType is word', () => {
      const wordSection = {...fakeSection, loginType: SectionLoginType.word};
      const wordStudent = {...fakeStudent, loginType: SectionLoginType.word};
      const wordStudents = {
        [wordStudent.id]: wordStudent
      };
      getStore().dispatch(setLoginType(SectionLoginType.word));
      getStore().dispatch(setSections([wordSection]));
      getStore().dispatch(setSection(wordSection));
      getStore().dispatch(setStudents(wordStudents));
      const wrapper = mount(
        <Provider store={getStore()}>
          <ManageStudentsTable />
        </Provider>
      );
      const passwordColumnHeader = wrapper.find('#password-header');
      expect(passwordColumnHeader).to.have.lengthOf(1);
      expect(passwordColumnHeader.text()).to.equal(i18n.secretWords());
      const showSecret = wrapper.find('ShowSecret');
      expect(showSecret).to.have.lengthOf(1);
      expect(showSecret.find('Button').text()).to.equal(i18n.showWords());
      const loginInfo = wrapper.find('ManageStudentsLoginInfo');
      expect(loginInfo.props().loginType).to.equal(SectionLoginType.word);
      expect(loginInfo.find('SignInInstructions').props().loginType).to.equal(
        SectionLoginType.word
      );
    });

    it('renders correctly if loginType is personal email', () => {
      const emailSection = {...fakeSection, loginType: SectionLoginType.email};
      const emailStudent = {...fakeStudent, loginType: SectionLoginType.email};
      const emailStudents = {
        [emailStudent.id]: emailStudent
      };
      getStore().dispatch(setLoginType(SectionLoginType.email));
      getStore().dispatch(setSections([emailSection]));
      getStore().dispatch(setSection(emailSection));
      getStore().dispatch(setStudents(emailStudents));
      const wrapper = mount(
        <Provider store={getStore()}>
          <ManageStudentsTable />
        </Provider>
      );
      const passwordColumnHeader = wrapper.find('#password-header');
      expect(passwordColumnHeader).to.have.lengthOf(1);
      expect(passwordColumnHeader.text()).to.equal(i18n.password());
      expect(wrapper.find('PasswordReset')).to.have.lengthOf(1);
      const loginInfo = wrapper.find('ManageStudentsLoginInfo');
      expect(loginInfo.props().loginType).to.equal(SectionLoginType.email);
      expect(loginInfo.find('SignInInstructions').props().loginType).to.equal(
        SectionLoginType.email
      );
    });

    it('renders correctly if loginType is clever', () => {
      const cleverSection = {
        ...fakeSection,
        loginType: SectionLoginType.clever
      };
      getStore().dispatch(setLoginType(SectionLoginType.clever));
      getStore().dispatch(setSections([cleverSection]));
      getStore().dispatch(setSection(cleverSection));
      const wrapper = mount(
        <Provider store={getStore()}>
          <ManageStudentsTable section={cleverSection} />
        </Provider>
      );
      const passwordColumnHeader = wrapper.find('#password-header');
      expect(passwordColumnHeader).to.have.lengthOf(0);
      const loginInfo = wrapper.find('ManageStudentsLoginInfo');
      expect(loginInfo.props().loginType).to.equal(SectionLoginType.clever);
      expect(loginInfo.find('SignInInstructions').props().loginType).to.equal(
        SectionLoginType.clever
      );
    });

    it('renders correctly if loginType is google_classroom', () => {
      const googleSection = {
        ...fakeSection,
        loginType: SectionLoginType.google_classroom
      };
      getStore().dispatch(setLoginType(SectionLoginType.google_classroom));
      getStore().dispatch(setSections([googleSection]));
      getStore().dispatch(setSection(googleSection));
      const wrapper = mount(
        <Provider store={getStore()}>
          <ManageStudentsTable section={googleSection} />
        </Provider>
      );
      const passwordColumnHeader = wrapper.find('#password-header');
      expect(passwordColumnHeader).to.have.lengthOf(0);
      const loginInfo = wrapper.find('ManageStudentsLoginInfo');
      expect(loginInfo.props().loginType).to.equal(
        SectionLoginType.google_classroom
      );
      expect(loginInfo.find('SignInInstructions').props().loginType).to.equal(
        SectionLoginType.google_classroom
      );
    });
  });
});
